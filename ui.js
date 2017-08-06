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
const Icons = Me.imports.icons;
const Settings = Me.imports.settings;
const Translation = Me.imports.translation;
const _ = Translation.translate;

/**
 * Indicator constructor
 * extends PanelMenu.Button
 *
 * @param  {Object}
 * @return {Object}
 */
const Indicator = new Lang.Class({

    Name: 'Ui.Indicator',
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
     * Initialize object properties
     *
     * @return {Void}
     */
    _def: function() {
        // to do:
        // settings
        // notification
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _ui: function() {
        this.actor.add_style_class_name('panel-status-button');
        this.actor.add_style_class_name('gnome-screenshot');

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

    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_monitor: function(actor, event) {

    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_window: function(actor, event) {

    },

    /**
     * Menu item desktop click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_menu_item_selection: function(actor, event) {

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

});
