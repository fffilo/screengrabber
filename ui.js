/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const Main = imports.ui.main;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Meta = imports.gi.Meta;
const Tweener = imports.ui.tweener;
const MessageTray = imports.ui.messageTray;
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
        this.notification = new Notification();

        // to do:
        // settings
        // grabber
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
        this._grabber = new Grabber();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.actor.add_style_class_name('.gnome-screenshot-grabber-desktop');
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
        this._grabber = new GrabberMonitor();
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
        this._grabber = new GrabberWindow();
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
        this._grabber = new GrabberSelection();
        this._grabber.connect('screenshot', Lang.bind(this, this._handle_grabber_screenshot));
        this._grabber.connect('cancel', Lang.bind(this, this._handle_grabber_cancel));
        this._grabber.set_selection(10,20,30,40);
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
     * Grabber screenshot event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_grabber_screenshot: function(actor, event) {
        let [ handle, filename ] = GLib.file_open_tmp(null);
        let screenshot = new Shell.Screenshot();
        screenshot.screenshot_area(event.left, event.top, event.width, event.height, filename, Lang.bind(this, this._handle_screenshot_save));
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
     * Screenshot callback event handler
     *
     * @param  {Object}  actor
     * @param  {Boolean} result
     * @param  {Object}  area
     * @param  {String}  filename
     * @return {Void}
     */
    _handle_screenshot_save: function(actor, result, area, filename) {
        // to do: flash enabled in settings?
        this.flash(area);

        // to do: filename template from settings
        let now = new Date();
        let _Y = now.getFullYear();
        let _m = ('0' + (now.getMonth() + 1)).substr(-2);
        let _d = ('0' + now.getDate()).substr(-2);
        let _H = ('0' + now.getHours()).substr(-2);
        let _M = ('0' + now.getMinutes()).substr(-2);
        let _S = ('0' + now.getSeconds()).substr(-2);

        // move temp file to ~/Pictures
        let src = filename;
        let dst = 'Screenshot from %s-%s-%s %s-%s-%s'.format(_Y, _m, _d, _H, _M, _S);
        dst = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES) + '/' + dst;
        Gio.file_new_for_path(src).move(Gio.file_new_for_path(dst), Gio.FileCopyFlags.OVERWRITE, null, null);

        // to do: upload file

        // show notification
        // to do: link destination
        this.notification.show(Me.metadata.name, dst);

        // clear grabber
        this._grabber.cancel();
    },

    /**
     * Simulate camera flash
     *
     * @param  {Object} area
     * @return {Void}
     */
    flash: function(area) {
        let flash = new Container();
        flash.actor.add_style_class_name('gnome-screenshot-flash');
        flash.set_position(area.x, area.y)
        flash.set_size(area.width, area.height)
        Main.uiGroup.add_actor(flash.actor);
        //flash.maximize();

        flash.fade_out(0.5, function(actor) {
            Main.uiGroup.remove_actor(flash.actor);
            actor.destroy();
        });

        global.play_theme_sound(0, 'camera-shutter', 'Taking screenshot', null);
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
        this.emit('destroy');
        this.disconnectAll();
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
     * Fill parent (if exists):
     * set position 0,0 and size
     * as the parent
     *
     * @return {Void}
     */
    maximize: function() {
        let actor = this.actor.get_parent();
        if (!actor)
            return;

        let size = actor.get_size();
        this.actor.set_position(0, 0);
        this.actor.set_size(size[0], size[1]);
    },

    /**
     * Fade in animation
     *
     * @param  {Number}   timeout  (optional)
     * @param  {Function} callback (optional)
     * @return {Void}
     */
    fade_in: function(timeout, callback) {
        this.actor.opacity = 0;
        this.visible = true;

        Tweener.addTween(this.actor, {
            opacity: 255,
            time: timeout || 0.5,
            transition: 'easeInQuad',
            onComplete: Lang.bind(this, function() {
                if (typeof callback === 'function')
                    callback.call(this, this);
            })
        });

    },

    /**
     * Fade out animation
     *
     * @param  {Number}   timeout  (optional)
     * @param  {Function} callback (optional)
     * @return {Void}
     */
    fade_out: function(timeout, callback) {
        this.actor.opacity = 255;
        this.visible = true;

        Tweener.addTween(this.actor, {
            opacity: 0,
            time: timeout || 0.5,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function() {
                this.visible = false;

                if (typeof callback === 'function')
                    callback.call(this, this);
            })
        });
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

Signals.addSignalMethods(Container.prototype);

/**
 * Grabber constructor
 *
 * blank screen graber fullscreen
 * container (container with overlay
 * and selection area)
 *
 * @param  {Object}
 * @return {Object}
 */
const Grabber = new Lang.Class({

    Name: 'Ui.Grabber',
    Extends: Container,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('gnome-screenshot-grabber');

        this.backgroundTop = new Container();
        this.backgroundTop.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundTop.actor.reactive = false;
        this.add(this.backgroundTop.actor);

        this.backgroundRight = new Container();
        this.backgroundRight.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundRight.actor.reactive = false;
        this.add(this.backgroundRight.actor);

        this.backgroundBottom = new Container();
        this.backgroundBottom.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundBottom.actor.reactive = false;
        this.add(this.backgroundBottom.actor);

        this.backgroundLeft = new Container();
        this.backgroundLeft.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundLeft.actor.reactive = false;
        this.add(this.backgroundLeft.actor);

        this.selection = new Container();
        this.selection.actor.add_style_class_name('gnome-screenshot-selection');
        this.selection.actor.reactive = false;
        this.add(this.selection.actor);

        Main.uiGroup.add_actor(this.actor);
        this.maximize();
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        Main.popModal(this.actor);
        global.screen.set_cursor(Meta.Cursor.DEFAULT);
        Main.uiGroup.remove_actor(this.actor);
        this.parent();
    },

    /**
     * Visible property setter
     * (override)
     *
     * @param  {Boolean}
     * @return {Void}
     */
    set visible(value) {
        this.actor.visible = value;
        global.screen.set_cursor(value ? Meta.Cursor.CROSSHAIR : Meta.Cursor.DEFAULT);
        Main[value ? 'pushModal' : 'popModal'](this.actor);
    },

    /**
     * Get current selection
     * (false on no selection)
     *
     * @return {Void}
     */
    get_selection: function() {
        if (!this.selection.visible)
            return false;

        return {
            left: this.selection.left,
            top: this.selection.top,
            width: this.selection.width,
            height: this.selection.height,
        }
    },

    /**
     * Set selection
     *
     * @param  {Number} left
     * @param  {Number} top
     * @param  {Number} width
     * @param  {Number} height
     * @return {Void}
     */
    set_selection: function(left, top, width, height) {
        this.backgroundTop.left = 0;
        this.backgroundTop.top = 0;
        this.backgroundTop.width = this.width;
        this.backgroundTop.height = top;

        this.backgroundRight.left = left + width;
        this.backgroundRight.top = top;
        this.backgroundRight.width = this.width - this.backgroundRight.left;
        this.backgroundRight.height = height;

        this.backgroundBottom.left = 0;
        this.backgroundBottom.top = top + height;
        this.backgroundBottom.width = this.width;
        this.backgroundBottom.height = this.height - this.backgroundBottom.top;

        this.backgroundLeft.left = 0;
        this.backgroundLeft.top = top;
        this.backgroundLeft.width = left;
        this.backgroundLeft.height = height;

        this.selection.left = left;
        this.selection.top = top;
        this.selection.width = width;
        this.selection.height = height;

        this.selection.visible = true;
        this.backgroundLeft.visible = true;
        this.backgroundBottom.visible = true;
        this.backgroundRight.visible = true;
        this.backgroundTop.visible = true;

        this.actor.add_style_class_name('gnome-screenshot-grabber-with-selection');
    },

    /**
     * Set selection on entire
     * container
     *
     * @return {Void}
     */
    select_all: function() {
        this.set_selection(0, 0, this.width, this.height);
    },

    /**
     * Clear selection
     *
     * @return {Void}
     */
    clear_selection: function() {
        this.selection.visible = false;
        this.backgroundLeft.visible = false;
        this.backgroundBottom.visible = false;
        this.backgroundRight.visible = false;
        this.backgroundTop.visible = false;

        this.actor.remove_style_class_name('gnome-screenshot-grabber-with-selection');
    },

    /**
     * Emit screenshot signal
     *
     * @return {Void}
     */
    screenshot: function() {
        let event = this.get_selection();
        if (!event)
            return;

        this.emit('screenshot', event);
    },

    /**
     * Emit cancel signal
     *
     * @return {Void}
     */
    cancel: function() {
        this.emit('cancel', {});
    },

    /* --- */

});

/**
 * Grabber Highlights constructor
 *
 * Graber object which adds selection
 * on predefined highlights when user
 * hovers the mouse over it
 *
 * @param  {Object}
 * @return {Object}
 */
const GrabberHighlights = new Lang.Class({

    Name: 'Ui.GrabberHighlights',
    Extends: Grabber,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this._refresh_highlights();

        this.actor.connect('button-press-event', Lang.bind(this, this._handle_button_press_event));
        this.actor.connect('enter-event', Lang.bind(this, this._handle_enter_event));
        this.actor.connect('motion-event', Lang.bind(this, this._handle_motion_event));
    },

    /**
     * Define highlights
     * (highlights is list of rectangles
     * which are 'highlighted' on user
     * mouse move)
     *
     * @return {Void}
     */
    _refresh_highlights: function() {
        this._highlights = [];
    },

    /**
     * Define selection based on mouse
     * cursor position
     *
     * @param  {Number} x
     * @param  {Number} y
     * @return {Void}
     */
    _select_highlight: function(x, y) {
        for (let i = 0; i < this._highlights.length; i++) {
            let rect = this._highlights[i];
            let hover = true
                && x >= rect.left
                && x <= rect.left + rect.width
                && y >= rect.top
                && y <= rect.top + rect.height;

            if (hover)
                return this.set_selection(rect.left, rect.top, rect.width, rect.height);
        }

        return this.clear_selection();
    },

    /**
     * Signal button-press-event event handler
     *
     * @param  {Object} actor
     * @param  {Number} size
     * @param  {Object} alloc
     * @return {Void}
     */
    _handle_button_press_event: function(actor, event) {
        let type = event.type();
        let button = event.get_button();
        let selection = this.get_selection();

        if (event.type() == Clutter.EventType.BUTTON_PRESS && button == 3) {
            this.cancel();
        }
        else if (event.type() == Clutter.EventType.BUTTON_PRESS && button == 1 && selection) {
            this.screenshot();
        }
    },

    /**
     * Signal enter-event event handler
     *
     * to do: this is not working???
     *
     * @param  {Object} actor
     * @param  {Number} size
     * @param  {Object} alloc
     * @return {Void}
     */
    _handle_enter_event: function(actor, event) {
        let [ x, y ] = event.get_coords();
        this._select_highlight(x, y);
    },

    /**
     * Signal motion-event event handler
     *
     * @param  {Object} actor
     * @param  {Number} size
     * @param  {Object} alloc
     * @return {Void}
     */
    _handle_motion_event: function(actor, event) {
        let [ x, y ] = event.get_coords();
        this._select_highlight(x, y);
    },

    /* --- */

});

/**
 * Grabber Monitor constructor
 *
 * Grabber Highlights with monitor
 * rectangles as higlights
 *
 * @param  {Object}
 * @return {Object}
 */
const GrabberMonitor = new Lang.Class({

    Name: 'Ui.GrabberMonitor',
    Extends: GrabberHighlights,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('.gnome-screenshot-grabber-monitor');
    },

    /**
     * Define highlights
     *
     * @return {Void}
     */
    _refresh_highlights: function() {
        this.parent();

        for (let i = 0; i < Main.layoutManager.monitors.length; i++) {
            this._highlights.push({
                left: Main.layoutManager.monitors[i].x,
                top: Main.layoutManager.monitors[i].y,
                width: Main.layoutManager.monitors[i].width,
                height: Main.layoutManager.monitors[i].height,
            });
        }
    },

    /* --- */

});

/**
 * Grabber Window constructor
 *
 * Grabber Highlights with windows
 * rectangles as higlights
 *
 * @param  {Object}
 * @return {Object}
 */
const GrabberWindow = new Lang.Class({

    Name: 'Ui.GrabberWindow',
    Extends: GrabberHighlights,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('.gnome-screenshot-grabber-window');
    },

    /**
     * Define highlights
     *
     * @return {Void}
     */
    _refresh_highlights: function() {
        this.parent();

        // fiter and sort window actors
        let valid = [ Meta.WindowType.NORMAL, Meta.WindowType.DIALOG, Meta.WindowType.MODAL_DIALOG ];
        let windows = global.get_window_actors()
            .filter(function(actor) {
                // filter visible windows and normal/dialog windows
                let meta = actor.get_meta_window();
                let type = meta.get_window_type();

                return true
                    && actor.visible
                    && valid.indexOf(type) !== -1;
            })
            .sort(function(a, b) {
                // sort window list lowest layer first
                return a.get_meta_window().get_layer() <= b.get_meta_window().get_layer();
            });

        // iterete windows and push to this._highlights
        for (let i = 0; i < windows.length; i++) {
            let actor = windows[i];
            let meta = actor.get_meta_window();
            let frame = meta.get_frame_rect();

            this._highlights.push({
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
            });
        }
    },

    /* --- */

});

/**
 * Grabber Selection constructor
 *
 * bind mouse hover on actor
 * allowing user to create
 * selection area (drag)
 *
 * @param  {Object}
 * @return {Object}
 */
const GrabberSelection = new Lang.Class({

    Name: 'Ui.GrabberSelection',
    Extends: Grabber,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('.gnome-screenshot-grabber-selection');

        // temporary cancel on click
        this.actor.connect('button-press-event', Lang.bind(this, function() {
            this.cancel();
        }));
    },

    /* --- */

});
