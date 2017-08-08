/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

// Default screenshot filename template
const DefaultTemplate = 'Screenshot from %Y-%m-%d %H-%M-%S.png';

/**
 * Get full path of a special
 * directory using its logical
 * id
 *
 * @param  {Number} dir
 * @return {String}
 */
const user_special_dir = function(dir) {
    dir = (dir || '').toUpperCase();

    if (dir === 'ROOT') return '/';
    else if (dir === 'DESKTOP') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DESKTOP);
    else if (dir === 'DOCUMENTS') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOCUMENTS);
    else if (dir === 'DOWNLOAD') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_DOWNLOAD);
    else if (dir === 'MUSIC') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_MUSIC);
    else if (dir === 'PICTURES') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
    else if (dir === 'PUBLIC_SHARE') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PUBLIC_SHARE);
    else if (dir === 'TEMPLATES') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_TEMPLATES);
    else if (dir === 'VIDEOS') return GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_VIDEOS);

    return null;
}

/**
 * Get screenshot filename from
 * template
 *
 * @param  {Object} rect     (optional)
 * @param  {String} template (optional)
 * @return {String}
 */
const screenshot = function(rect, template) {
    return new GLib.DateTime()
        .format(template || DefaultTemplate)
            .replace(/{width}/g, typeof rect === 'object' && ('width' in rect) ? rect.width : '_')
            .replace(/{height}/g, typeof rect === 'object' && ('height' in rect) ? rect.height : '_')
            .replace(/{username}/g, GLib.get_user_name())
            .replace(/{realname}/g, GLib.get_real_name())
            .replace(/{hostname}/g, GLib.get_host_name());
}

/**
 * Get temp filename
 *
 * @return {String}
 */
const temp = function() {
    let [ handle, filename ] = GLib.file_open_tmp(null);
    return filename;
}

/**
 * Move file from source to
 * destination
 *
 * @param  {String}  src
 * @param  {String}  dst
 * @return {Boolean}
 */
const move = function(src, dst) {
    let fsrc = Gio.file_new_for_path(src);
    let fdst = Gio.file_new_for_path(dst);
    let flag = Gio.FileCopyFlags.OVERWRITE;

    return fsrc.move(fdst, flag, null, null);
}
