/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const Gdk = imports.gi.Gdk;

/**
 * Screen constructor
 *
 * simplified default Gdk.Screen
 * object
 *
 * @param  {Object}
 * @return {Object}
 */
const Screen = new Lang.Class({

    Name: 'Screen.Screen',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.actor = Gdk.Screen.get_default();

        this._signals = [
            this.actor.connect('composited-changed', Lang.bind(this, this._handle_composited_changed)),
            this.actor.connect('monitors-changed', Lang.bind(this, this._handle_monitors_changed)),
            this.actor.connect('size-changed', Lang.bind(this, this._handle_size_changed)),
        ];
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        while (this._signals.length) {
            this.actor.disconnect(this._signals.pop());
        }
    },

    /**
     * Property width getter
     *
     * @return {Number}
     */
    get width() {
        return this.actor.get_width();
    },

    /**
     * Property height getter
     *
     * @return {Number}
     */
    get height() {
        return this.actor.get_height();
    },

    /**
     * Property monitor getter:
     * list of each monitor geometry
     *
     * @return {Object}
     */
    get monitors() {
        let result = [];

        for (let i = 0; i < this.actor.get_n_monitors(); i++) {
            let rect = this.actor.get_monitor_geometry(i);

            result.push({
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
            })
        }

        return result;
    },

    /**
     * Signal composited-changed event handler
     *
     * @param  {Object} actor
     * @return {Void}
     */
    _handle_composited_changed: function(actor) {
        this.emit('composited-changed');
    },

    /**
     * Signal monitors-changed event handler
     *
     * @param  {Object} actor
     * @return {Void}
     */
    _handle_monitors_changed: function(actor) {
        this.emit('monitors-changed');
    },

    /**
     * Signal size-changed event handler
     *
     * @param  {Object} actor
     * @return {Void}
     */
    _handle_size_changed: function(actor) {
        this.emit('size-changed');
    },

    /* --- */

});

Signals.addSignalMethods(Screen.prototype);
