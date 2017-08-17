/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

// Default screenshot filename template
const DEFAULT_TEMPLATE = 'Screenshot from %Y-%m-%d %H-%M-%S.png';

/**
 * Get full path of a special
 * directory using its logical
 * id
 *
 * @param  {Number} dir
 * @return {String}
 */
const user_special_dir = function(dir) {
    dir = (dir || 'home').toUpperCase();

    if (dir === 'ROOT') return '/';
    else if (dir === 'HOME') return GLib.get_home_dir();
    else if (dir === 'TMP') return GLib.get_tmp_dir();
    else if (dir === 'CACHE') return GLib.get_user_cache_dir();
    else if (dir === 'CONFIG') return GLib.get_user_config_dir();
    else if (dir === 'DATA') return GLib.get_user_data_dir();
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
 * Get screenshot filename from template.
 * Result is always absoulute path of
 * file. If template returns relative
 * path, file will be added to special
 * directory PICTURES.
 *
 * @param  {Object} rect     (optional)
 * @param  {String} template (optional)
 * @return {String}
 */
const screenshot = function(rect, template) {
    let result = new GLib.DateTime()
        .format(template || DEFAULT_TEMPLATE)
            .replace(/{width}/gi, typeof rect === 'object' && ('width' in rect) ? rect.width : '0')
            .replace(/{height}/gi, typeof rect === 'object' && ('height' in rect) ? rect.height : '0')
            .replace(/{username}/gi, GLib.get_user_name())
            .replace(/{realname}/gi, GLib.get_real_name())
            .replace(/{hostname}/gi, GLib.get_host_name())
            .replace(/\$home(\W|$)/gi, user_special_dir('home') + '$1')
            .replace(/\$tmp(\W|$)/gi, user_special_dir('tmp') + '$1')
            .replace(/\$cache(\W|$)/gi, user_special_dir('cache') + '$1')
            .replace(/\$config(\W|$)/gi, user_special_dir('config') + '$1')
            .replace(/\$data(\W|$)/gi, user_special_dir('data') + '$1')
            .replace(/\$desktop(\W|$)/gi, user_special_dir('desktop') + '$1')
            .replace(/\$documents(\W|$)/gi, user_special_dir('documents') + '$1')
            .replace(/\$download(\W|$)/gi, user_special_dir('download') + '$1')
            .replace(/\$music(\W|$)/gi, user_special_dir('music') + '$1')
            .replace(/\$pictures(\W|$)/gi, user_special_dir('pictures') + '$1')
            .replace(/\$public_share(\W|$)/gi, user_special_dir('public_share') + '$1')
            .replace(/\$templates(\W|$)/gi, user_special_dir('templates') + '$1')
            .replace(/\$videos(\W|$)/gi, user_special_dir('videos') + '$1')
            .replace(/\${home}/gi, user_special_dir('home'))
            .replace(/\${tmp}/gi, user_special_dir('tmp'))
            .replace(/\${cache}/gi, user_special_dir('cache'))
            .replace(/\${config}/gi, user_special_dir('config'))
            .replace(/\${data}/gi, user_special_dir('data'))
            .replace(/\${desktop}/gi, user_special_dir('desktop'))
            .replace(/\${documents}/gi, user_special_dir('documents'))
            .replace(/\${download}/gi, user_special_dir('download'))
            .replace(/\${music}/gi, user_special_dir('music'))
            .replace(/\${pictures}/gi, user_special_dir('pictures'))
            .replace(/\${public_share}/gi, user_special_dir('public_share'))
            .replace(/\${templates}/gi, user_special_dir('templates'))
            .replace(/\${videos}/gi, user_special_dir('videos'));

    // absolute path
    if (!GLib.path_is_absolute(result))
        result = user_special_dir('pictures') + '/' + result;

    // fix path
    result = Gio.File.new_for_path(result).get_path();

    return result;
}

/**
 * Get temp filename
 *
 * @return {String}
 */
const temp = function() {
    let [ handle, filename ] = GLib.file_open_tmp(null);
    GLib.close(handle);

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

/**
 * Convert filename to URI
 *
 * @param  {String} path
 * @return {String}
 */
const to_uri = function(path) {
    return GLib.filename_to_uri(path, null);
}

/**
 * Get filename from URI
 *
 * @param  {String} path
 * @return {String}
 */
const from_uri = function(path) {
    return GLib.filename_from_uri(path, null);
}
