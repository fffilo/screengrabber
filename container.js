/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const Shell = imports.gi.Shell;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;

/**
 * Container Base constructor
 *
 * Shell.GenericContainer widget
 * that can contain multiple
 * absolute positioned childs
 *
 * @param  {Object}
 * @return {Object}
 */
const Base = new Lang.Class({

    Name: 'Container.Base',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.actor = new Shell.GenericContainer({
            style_class: 'screengrabber-container',
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

Signals.addSignalMethods(Base.prototype);
