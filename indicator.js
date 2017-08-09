/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Main = imports.ui.main;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const File = Me.imports.file;
const Screen = Me.imports.screen;
const Notification = Me.imports.notification;
const Container = Me.imports.container;
const Grabber = Me.imports.grabber;
const Icons = Me.imports.icons;
const Settings = Me.imports.settings;
const Translation = Me.imports.translation;
const _ = Translation.translate;

/**
 * Indicator Base constructor
 *
 * ScreenGrabber indicator
 * extends PanelMenu.Button
 *
 * @param  {Object}
 * @return {Object}
 */
const Base = new Lang.Class({

    Name: 'Indicator.Base',
    Extends: PanelMenu.Button,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent(null, Me.metadata.name);

        this._def();
        this._ui();

        Main.panel.addToStatusArea(Me.metadata.uuid, this);
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this.screen.destroy();
        //this.settings.run_dispose();

        this.parent();
    },

    /**
     * Initialize object properties
     *
     * @return {Void}
     */
    _def: function() {
        this.screen = new Screen.Screen();
        this.screen.connect('composited-changed', Lang.bind(this, this._handle_screen));
        this.screen.connect('monitors-changed', Lang.bind(this, this._handle_screen));
        this.screen.connect('size-changed', Lang.bind(this, this._handle_screen));

        this.notification = new Notification.Base();

        // to do:
        // settings
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _ui: function() {
        this.actor.add_style_class_name('panel-status-button');
        this.actor.add_style_class_name('screengrabber');

        this.icon = new St.Icon({
            icon_name: Icons.DEFAULT,
            style_class: 'system-status-icon',
        });
        this.actor.add_actor(this.icon);

        this.menuDesktop = new PopupMenu.PopupMenuItem(_("Desktop"));
        this.menuDesktop.connect('activate', Lang.bind(this, this._handle_menu_item_desktop));
        this.menu.addMenuItem(this.menuDesktop);

        this.menuMonitor = new PopupMenu.PopupMenuItem(_("Monitor"));
        this.menuMonitor.connect('activate', Lang.bind(this, this._handle_menu_item_monitor));
        this.menu.addMenuItem(this.menuMonitor);

        this.menuWindow = new PopupMenu.PopupMenuItem(_("Window"));
        this.menuWindow.connect('activate', Lang.bind(this, this._handle_menu_item_window));
        this.menu.addMenuItem(this.menuWindow);

        this.menuSelection = new PopupMenu.PopupMenuItem(_("Selection"));
        this.menuSelection.connect('activate', Lang.bind(this, this._handle_menu_item_selection));
        this.menu.addMenuItem(this.menuSelection);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this.menuPreferences = new PopupMenu.PopupMenuItem(_("Preferences"));
        this.menuPreferences.connect('activate', Lang.bind(this, this._handle_menu_item_preferences));
        this.menu.addMenuItem(this.menuPreferences);
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_desktop: function(actor, event) {
        this._grabber = new Grabber.Base();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.actor.add_style_class_name('.screengrabber-grabber-desktop');
        this._grabber.select_all();
        //this._grabber.visible = true;
        this._grabber.screenshot();
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_monitor: function(actor, event) {
        this._grabber = new Grabber.Monitor();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.visible = true;
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_window: function(actor, event) {
        this._grabber = new Grabber.Window();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.visible = true;
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_selection: function(actor, event) {
        this._grabber = new Grabber.Selection();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.visible = true;
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_preferences: function(actor, event) {

    },

    /**
     * Screen change signal event handler
     *
     * @param  {Object} actor
     * @return {Void}
     */
    _handle_screen: function(actor) {
        if (this._grabber)
            this._grabber.cancel();
    },

    /**
     * Grabber screenshot event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_grabber_screenshot: function(actor, event) {
        // to do: flash settings
        let area = event.area,
            mute = false;
        //if (!this.settings.get_boolean('show-flash'))
        //    area = false;
        //if (this.settings.get_boolean('mute-flash'))
        //    mute = true;
        this.flash(area, mute);

        // to do: filename template from settings
        let src = event.filename;
        let dst = File.user_special_dir('pictures') + '/' + File.screenshot(event.area, File.DefaultTemplate);
        File.move(src, dst);

        // show notification
        // to do: link destination
        this.notification.show(Me.metadata.name, dst);

        // clear grabber
        this._grabber.cancel();
    },

    /**
     * Grabber cancel event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_grabber_cancel: function(actor, event) {
        actor.destroy();
        this._grabber = null;
    },

    /**
     * Simulate camera flash
     *
     * @param  {Object}  area
     * @param  {Boolean} mute
     * @return {Void}
     */
    flash: function(area, mute) {
        if (area) {
            let flash = new Container.Base();
            flash.actor.add_style_class_name('screengrabber-flash');
            flash.set_position(area.left, area.top);
            flash.set_size(area.width, area.height);
            Main.uiGroup.add_actor(flash.actor);
            //flash.maximize();

            flash.fade_out(0.5, function(actor) {
                Main.uiGroup.remove_actor(flash.actor);
                actor.destroy();
            });
        }

        if (!mute)
            global.play_theme_sound(0, 'camera-shutter', 'Taking screenshot', null);
    },

    /* --- */

});
