/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const File = Me.imports.file;
const Container = Me.imports.container;

/**
 * Grabber Base constructor
 *
 * blank screen graber fullscreen
 * container (container with overlay
 * and selection area)
 *
 * @param  {Object}
 * @return {Object}
 */
const Base = new Lang.Class({

    Name: 'Grabber.Base',
    Extends: Container.Base,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('gnome-screenshot-grabber');
        this.actor.connect('key-press-event', Lang.bind(this, this._handle_key_press_event));

        this.backgroundTop = new Container.Base();
        this.backgroundTop.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundTop.actor.reactive = false;
        this.add(this.backgroundTop.actor);

        this.backgroundRight = new Container.Base();
        this.backgroundRight.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundRight.actor.reactive = false;
        this.add(this.backgroundRight.actor);

        this.backgroundBottom = new Container.Base();
        this.backgroundBottom.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundBottom.actor.reactive = false;
        this.add(this.backgroundBottom.actor);

        this.backgroundLeft = new Container.Base();
        this.backgroundLeft.actor.add_style_class_name('gnome-screenshot-background');
        this.backgroundLeft.actor.reactive = false;
        this.add(this.backgroundLeft.actor);

        this.selection = new Container.Base();
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
        this._modal(false);
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
        this._modal(value);
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
            left: Math.round(this.selection.left),
            top: Math.round(this.selection.top),
            width: Math.round(this.selection.width),
            height: Math.round(this.selection.height),
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
        let rect = this._rect(left, top, width, height);

        this.backgroundTop.left = 0;
        this.backgroundTop.top = 0;
        this.backgroundTop.width = this.width;
        this.backgroundTop.height = rect.top;

        this.backgroundRight.left = rect.left + rect.width;
        this.backgroundRight.top = rect.top;
        this.backgroundRight.width = this.width - this.backgroundRight.left;
        this.backgroundRight.height = rect.height;

        this.backgroundBottom.left = 0;
        this.backgroundBottom.top = rect.top + rect.height;
        this.backgroundBottom.width = this.width;
        this.backgroundBottom.height = this.height - this.backgroundBottom.top;

        this.backgroundLeft.left = 0;
        this.backgroundLeft.top = rect.top;
        this.backgroundLeft.width = rect.left;
        this.backgroundLeft.height = rect.height;

        this.selection.left = rect.left;
        this.selection.top = rect.top;
        this.selection.width = rect.width;
        this.selection.height = rect.height;

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
     * Grab screenshot
     *
     * @return {Void}
     */
    screenshot: function() {
        let area = this.get_selection();
        if (!area || area.width <= 0 || area.height <= 0)
            return;

        let filename = File.temp();
        let screenshot = new Shell.Screenshot();
        screenshot.screenshot_area(area.left, area.top, area.width, area.height, filename, Lang.bind(this, this._handle_screenshot));
    },

    /**
     * Emit cancel signal
     *
     * @return {Void}
     */
    cancel: function() {
        this.emit('cancel', {});
    },

    /**
     * Main push/pop modal
     *
     * @param  {Boolean} add
     * @return {Void}
     */
    _modal: function(add) {
        let method = add ? 'pushModal' : 'popModal';
        if (typeof Main[method] !== 'function')
            return;
        if (!this.visible && !add)
            return;

        Main[method](this.actor);
    },

    /**
     * Fix rect
     *
     * @param  {Number} left
     * @param  {Number} top
     * @param  {Number} width
     * @param  {Number} height
     * @return {Object}
     */
    _rect: function(left, top, width, height) {
        let result = {
            left: left,
            top: top,
            width: width,
            height: height,
        }

        if (result.width < 0) {
            result.left += width;
            result.width *= -1;
        }
        if (result.height < 0) {
            result.top += height;
            result.height *= -1;
        }
        if (result.left < 0) {
            result.width += result.left;
            result.left = 0;
        }
        if (result.top < 0) {
            result.height += result.top;
            result.top = 0;
        }
        if (result.width + result.left > this.width)
            result.width = this.width - result.left;
        if (result.height + result.top > this.height)
            result.height = this.height - result.top;

        return result;
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
    _handle_screenshot: function(actor, result, area, filename) {
        this.emit('screenshot', {
            result: result,
            filename: filename,
            area: area,
        });
    },

    /**
     * Container key-press-event event handler:
     * this method will pass it's arguments
     * to a _handle_key_press_event method
     * with suffix of event key hex code.
     * For example ESC keypess will execute
     * this._handle_key_press_event_0x1b(),
     * if method exists (27, or hexadecimal
     * 0x1b, is ascii code of ESC)
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_key_press_event: function(actor, event) {
        let hex = 'unkonwn';
        try {
            let key = event.get_key_unicode();
            let chr = key.charCodeAt(0);
            hex = chr.toString(16);
            hex = ('00' + hex).substr(-2);
            hex = '0x' + hex;
        }
        catch(e) {
            // pass
        }

        if (typeof this['_handle_key_press_event_' + hex] === 'function')
            this['_handle_key_press_event_' + hex](actor, event);
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
const Highlights = new Lang.Class({

    Name: 'Grabber.Highlights',
    Extends: Base,

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
        let button = event.get_button();
        let area = this.get_selection();

        if (button == 3) {
            this.cancel();
        }
        else if (button == 1 && area) {
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

    /**
     * Container key-press-event event handler
     * for key escape
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_key_press_event_0x1b: function(actor, event) {
        this.cancel();
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
const Monitor = new Lang.Class({

    Name: 'Grabber.Monitor',
    Extends: Highlights,

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
const Window = new Lang.Class({

    Name: 'Grabber.Window',
    Extends: Highlights,

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
const Selection = new Lang.Class({

    Name: 'Grabber.Selection',
    Extends: Base,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.parent();
        this.actor.add_style_class_name('.gnome-screenshot-grabber-selection');

        this.actor.connect('button-press-event', Lang.bind(this, this._handle_button_press_event));
        this.actor.connect('button-release-event', Lang.bind(this, this._handle_button_release_event));
        this.actor.connect('motion-event', Lang.bind(this, this._handle_motion_event));

        this._button_press_event_start = null;
    },

    /**
     * Container button-press-event event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_button_press_event: function(actor, event) {
        let button = event.get_button();

        if (button == 3) {
            this.cancel();
        }
        else if (button == 1) {
            this._button_press_event_start = event.get_coords();
        }
    },

    /**
     * Container button-release-event event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_button_release_event: function(actor, event) {
        if (!this._button_press_event_start)
            return

        this._handle_motion_event(actor, event);
        this._button_press_event_start = null;

        // to do: check if selection is too small
        this.screenshot();
    },

    /**
     * Container motion-event event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_motion_event: function(actor, event) {
        if (!this._button_press_event_start)
            return

        let start = this._button_press_event_start;
        let drag = event.get_coords();
        this.set_selection(start[0], start[1], drag[0] - start[0], drag[1] - start[1]);
    },

    /**
     * Container key-press-event event handler
     * for key escape
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_key_press_event_0x1b: function(actor, event) {
        if (this.get_selection())
            this.clear_selection();
        else
            this.cancel();
    },

    /* --- */

});
