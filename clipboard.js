/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;

/**
 * Clipboard constructor
 *
 * simplified Gtk.Clipboard object
 *
 * @param  {Object}
 * @return {Object}
 */
const Clipboard = new Lang.Class({

    Name: 'Clipboard.Clipboard',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this.actor = Gtk.Clipboard.get_default(Gdk.Display.get_default());
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        // pass
    },

    /**
     * Clear clipboard:
     *
     * proxy for Gtk.Clipboard.prototype.clear
     *
     * @return {Void}
     */
    clear: function() {
        return this.actor.clear();
    },

    /**
     * Set text to clipboard
     *
     * proxy for Gtk.Clipboard.prototype.set_text
     *
     * @param  {String} text
     * @return {Void}
     */
    set_text: function(text) {
        return this.actor.set_text(text, -1);
    },

    /**
     * Set image to clipboard
     *
     * proxy for Gtk.Clipboard.prototype.set_image
     *
     * @param  {Mixed} image
     * @return {Void}
     */
    set_image: function(image) {
        if (typeof image === 'string')
            image = GdkPixbuf.Pixbuf.new_from_file(image);
        else if (image instanceof Gtk.Image)
            image = image.get_pixbuf();

        return this.actor.set_image(image);
    },

    /* --- */

});
