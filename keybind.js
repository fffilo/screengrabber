/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const Main = imports.ui.main;

/**
 * Add keybind (key in settings)
 * to main window manager
 *
 * @param  {String}   key
 * @param  {Object}   settings
 * @param  {Function} handler
 * @return {Void}
 */
const add = function(key, settings, handler) {
	Main.wm.addKeybinding(key, settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL, handler);
}

/**
 * Remove keybind (key in settings)
 * from main window manager
 *
 * @param  {String} key
 * @return {Void}
 */
const remove = function(key) {
	Main.wm.removeKeybinding(key);
}
