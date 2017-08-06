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
 *
 * GNOME Screenshot indicator
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

    /* --- */

});

/**
 * Notification constructor
 *
 * create and display notification
 *
 * @param  {Object}
 * @return {Object}
 */
const Notification = new Lang.Class({

    Name: 'Ui.Notification',

    /**
     * Constructor
     *
     * @param  {String} title
     * @param  {String} icon
     * @return {Void}
     */
    _init: function(title, icon) {
        this._title = title || Me.metadata.name;
        this._icon = icon || Icons.DEFAULT;

        this._source = null;
    },

    /**
     * Prepare source
     *
     * @return {Void}
     */
    _prepare: function() {
        if (this._source !== null)
            return;

        this._source = new MessageTray.Source(this._title, this._icon);
        this._source.connect('destroy', Lang.bind(this, this._handle_destroy));

        Main.messageTray.add(this._source);
    },

    /**
     * Get existing notification from
     * source or create new one
     *
     * @param  {String} title
     * @param  {String} message
     * @return {Object}
     */
    _notification: function(title, message) {
        let result = null;
        if (this._source.notifications.length) {
            result = this._source.notifications[0];
            result.update(title, message, {
                clear: true,
            });
        }
        else {
            result = new MessageTray.Notification(this._source, title, message);
            result.setTransient(true);
            result.setResident(false);
        }

        return result;
    },

    /**
     * Source destroy event handler:
     * clear source
     *
     * @return {Void}
     */
    _handle_destroy: function() {
        this._source = null;
    },

    /**
     * Show notification
     *
     * @param  {String} title
     * @param  {String} message
     * @return {Void}
     */
    show: function(title, message) {
        this._prepare();
        this._source.notify(this._notification(title, message));
    },

});

/**
 * Container constructor
 *
 * Shell.GenericContainer widget
 * that can contain multiple
 * absolute positioned childs
 *
 * @param  {Object}
 * @return {Object}
 */
const Container = new Lang.Class({

    Name: 'Ui.Container',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.actor = new Shell.GenericContainer({
            style_class: 'gnome-screenshot-container',
            visible: false,
            reactive: true,
        });

        this.actor.connect('get-preferred-width', Lang.bind(this, this._handle_get_preferred_width));
        this.actor.connect('get-preferred-height', Lang.bind(this, this._handle_get_preferred_height));
        this.actor.connect('allocate', Lang.bind(this, this._handle_allocate));
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this.actor.destroy();
        // this.emit('destroy');
    },

    /**
     * Signal get-preferred-width event handler
     *
     * @param  {Object} actor
     * @param  {Number} size
     * @param  {Object} alloc
     * @return {Void}
     */
    _handle_get_preferred_width: function(actor, size, alloc) {
        alloc.min_size = 0;
        alloc.natural_size = size;
    },

    /**
     * Signal get-preferred-height event handler
     *
     * @param  {Object} actor
     * @param  {Number} size
     * @param  {Object} alloc
     * @return {Void}
     */
    _handle_get_preferred_height: function(actor, size, alloc) {
        alloc.min_size = 0;
        alloc.natural_size = size;
    },

    /**
     * Signal allocate event handler
     *
     * @param  {Object} actor
     * @param  {Object} box
     * @param  {Number} flags
     * @return {Void}
     */
    _handle_allocate: function(actor, box, flags) {
        let children = actor.get_children();

        for (let i = 0; i < children.length; i++) {
            let child = children[i];
            let position = child.get_position();
            let size = child.get_size();
            let abox = new Clutter.ActorBox({
                x1: position[0],
                y1: position[1],
                x2: position[0] + size[0],
                y2: position[1] + size[1],
            });

            child.allocate(abox, flags);
        }
    },

    /**
     * Add child
     *
     * @param {Object} actor
     * @return {Void}
     */
    add: function(actor) {
        this.actor.add_actor(actor);
    },

    /**
     * Remove child
     *
     * @param {Object} actor
     * @return {Void}
     */
    remove: function(actor) {
        this.actor.remove_actor(actor);
    },

    /**
     * Get size of actor
     *
     * @return {Object}
     */
    get_size: function() {
        return this.actor.get_size();
    },

    /**
     * Set size of actor
     *
     * @param  {Number} width
     * @param  {Number} height
     * @return {Void}
     */
    set_size: function(width, height) {
        this.actor.set_size(width, height);
    },

    /**
     * Get position of actor
     *
     * @return {Object}
     */
    get_position: function() {
        return this.actor.get_position();
    },

    /**
     * Set position of actor
     *
     * @param  {Number} left
     * @param  {Number} top
     * @return {Void}
     */
    set_position: function(left, top) {
        this.actor.set_position(left, top);
    },

    /**
     * Visible property getter
     *
     * @return {Boolean}
     */
    get visible() {
        return this.actor.visible;
    },

    /**
     * Visible property setter
     *
     * @param  {Boolean}
     * @return {Void}
     */
    set visible(value) {
        this.actor.visible = value;
    },

    /**
     * Left property (position) getter
     *
     * @return {Number}
     */
    get left() {
        return this.get_position()[0];
    },

    /**
     * Left property (position) setter
     *
     * @params {Number}
     * @return {Void}
     */
    set left(value) {
        this.set_position(value, this.top);
    },

    /**
     * Top property (position) getter
     *
     * @return {Number}
     */
    get top() {
        return this.get_position()[1];
    },

    /**
     * Top property (position) setter
     *
     * @params {Number}
     * @return {Void}
     */
    set top(value) {
        this.set_position(this.left, value);
    },

    /**
     * Width property (size) getter
     *
     * @return {Number}
     */
    get width() {
        return this.get_size()[0];
    },

    /**
     * Width property (size) setter
     *
     * @params {Number}
     * @return {Void}
     */
    set width(value) {
        this.set_size(value, this.height);
    },

    /**
     * Height property (size) getter
     *
     * @return {Number}
     */
    get height() {
        return this.get_size()[1];
    },

    /**
     * Height property (size) setter
     *
     * @params {Number}
     * @return {Void}
     */
    set height(value) {
        this.set_size(this.width, value);
    },

    /* --- */

});
