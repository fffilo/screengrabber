/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Main = imports.ui.main;
const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Keybind = Me.imports.keybind;
const File = Me.imports.file;
const Screen = Me.imports.screen;
const Clipboard = Me.imports.clipboard;
const Notification = Me.imports.notification;
const Container = Me.imports.container;
const Grabber = Me.imports.grabber;
const Upload = Me.imports.upload;
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
        this._bind();

        this._handle_screen(this.screen);

        Main.panel.addToStatusArea(Me.metadata.uuid, this);
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this._unbind();

        this.screen.destroy();
        this.clipboard.destroy();
        this.settings.run_dispose();

        this.parent();
    },

    /**
     * Initialize object properties
     *
     * @return {Void}
     */
    _def: function() {
        this.settings = Settings.settings();
        this.settings.connect('changed', Lang.bind(this, this._handle_settings));

        this.clipboard = new Clipboard.Clipboard();

        this.screen = new Screen.Screen();
        this.screen.connect('composited-changed', Lang.bind(this, this._handle_screen));
        this.screen.connect('monitors-changed', Lang.bind(this, this._handle_screen));
        this.screen.connect('size-changed', Lang.bind(this, this._handle_screen));

        this.notification = new Notification.Base();
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
     * Add keybindings
     *
     * @return {Void}
     */
    _bind: function() {
        this._unbind();

        let actions = [ 'desktop', 'monitor', 'window', 'selection' ];
        for (let i in actions) {
            Keybind.add('shortcut-' + actions[i], this.settings, Lang.bind(this, this._handle_keybinding, actions[i]));
        }
    },

    /**
     * Remove keybindings
     *
     * @return {Void}
     */
    _unbind: function() {
        let actions = [ 'desktop', 'monitor', 'window', 'selection' ];
        for (let i in actions) {
            Keybind.remove('shortcut-' + actions[i]);
        }
    },

    _screenshot_flash: function(path, area) {
        let settings = this.settings.get_string('flash');
        let video = settings === 'both' || settings === 'video' ? area : false;
        let audio = !(settings === 'both' || settings === 'video');
        this.flash(video, audio);

        return path;
    },

    _screenshot_move: function(path, area) {
        let template = this.settings.get_string('filename-template');
        let provider = this.settings.get_string('upload-provider');
        let notifications = this.settings.get_boolean('notifications');
        let clipboard = this.settings.get_string('clipboard');

        if (template) {
            let result = File.screenshot(area, template);
            File.move(path, result);

            path = result;
        }

        if (notifications && !Upload.new_by_name(provider))
            this.notification.show(Me.metadata.name, File.to_uri(path));

        if (clipboard === 'uri')
            this.clipboard.set_text(File.to_uri(path));
        else if (clipboard === 'image')
            this.clipboard.set_image(path);

        return path;
    },

    _screenshot_upload: function(path, area) {
        let provider = this.settings.get_string('upload-provider');
        let upload = Upload.new_by_name(provider);
        if (upload) {
            upload.connect('done', Lang.bind(this, this._handle_upload));
            upload.upload(path);
        }

        return path;
    },

    /**
     * Settings changed event handler
     *
     * @param  {Object} actor
     * @param  {String} key
     * @return {Void}
     */
    _handle_settings: function(actor, key) {
        if (key.startsWith('shortcut-'))
            this._bind();
    },

    /**
     * Shortcut keypress event handler
     *
     * @param  {Object} display
     * @param  {Object} screen
     * @param  {Object} window
     * @param  {Object} binding
     * @param  {String} action
     * @return {Void}
     */
    _handle_keybinding: function(display, screen, window, binding, action) {
        let prop = 'menu' + action.charAt(0).toUpperCase() + action.slice(1);
        let item = this[prop];

        if (item && item._sensitive)
            item.activate();
    },

    /**
     * Uploader done signal event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_upload: function(actor, event) {
        let notifications = this.settings.get_boolean('notifications');
        let clipboard = this.settings.get_string('clipboard');
        let uri = event.data.preview || event.data.error || event.status.description;

        if (notifications)
            this.notification.show(Me.metadata.name, uri);
        if (clipboard === 'uri')
            this.clipboard.set_text(uri);
    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_desktop: function(actor, event) {
        this.menu.close(0);

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
        this._grabber.shadows = this.settings.get_boolean('shadows');
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
        Util.spawn(['gnome-shell-extension-prefs', Me.metadata.uuid]);
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

        this.menuMonitor.setSensitive(actor.monitors.length > 1);
    },

    /**
     * Grabber screenshot event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_grabber_screenshot: function(actor, event) {
        let path = event.filename;
        let area = event.area;

        path = this._screenshot_flash(path, area);
        path = this._screenshot_move(path, area);
        path = this._screenshot_upload(path, area);

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
