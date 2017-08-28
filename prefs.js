/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// import modules
const Lang = imports.lang;
const Signals = imports.signals;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GdkPixbuf = imports.gi.GdkPixbuf;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const File = Me.imports.file;
const Provider = Me.imports.provider;
const Icons = Me.imports.icons;
const Settings = Me.imports.settings;
const Translation = Me.imports.translation;
const _ = Translation.translate;

/**
 * Extension preferences initialization
 *
 * @return {Void}
 */
function init() {
    Translation.init();
}

/**
 * Extension preferences build widget
 *
 * @return {Void}
 */
function buildPrefsWidget() {
    return new Widget();
}

/**
 * Widget constructor
 * extends Gtk.Box
 *
 * @param  {Object}
 * @return {Object}
 */
const Widget = new GObject.Class({

    Name: 'Prefs.Widget',
    GTypeName: 'ScreenGrabberPrefsWidget',
    Extends: Gtk.Box,

    /**
     * Widget initialization
     *
     * @return {Void}
     */
    _init: function() {
        this.parent({ orientation: Gtk.Orientation.VERTICAL, });

        this._def();
        this._ui();
    },

    destroy: function() {
        this.parent();
        this.settings.run_dispose();
        this.parent();
    },

    /**
     * Initialize object properties
     *
     * @return {Void}
     */
    _def: function() {
        this.settings = Settings.settings();
        this.settings.connect('changed', Lang.bind(this, this._handle_settings));
    },

    /**
     * Create user interface
     *
     * @return {Void}
     */
    _ui: function() {
        let css = new Gtk.CssProvider();
        css.load_from_path(Me.path + '/prefs.css');
        Gtk.StyleContext.add_provider_for_screen(Gdk.Screen.get_default(), css, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        let notebook = new Gtk.Notebook();
        this.ui = {};
        notebook.append_page(this._page_settings(), new Gtk.Label({ label: _("Settings"), }));
        notebook.append_page(this._page_storage(), new Gtk.Label({ label: _("Storage"), }));
        notebook.append_page(this._page_keybinds(), new Gtk.Label({ label: _("Key Bindings"), }));
        notebook.append_page(this._page_about(), new Gtk.Label({ label: _("About"), }));
        this.add(notebook);

        this.show_all();
    },

    /**
     * Create new page
     *
     * @return {Object}
     */
    _page: function() {
        let page = new Box();
        page.expand = true;
        page.get_style_context().add_class('screengrabber-prefs-page');

        return page;
    },

    /**
     * Create new settings page
     *
     * @return {Object}
     */
    _page_settings: function() {
        this.ui.settings = {};
        this.ui.settings.page = this._page();
        this.ui.settings.page.get_style_context().add_class('screengrabber-prefs-page-settings');

        this.ui.settings.notifications = new InputSwitch('notifications', this.settings.get_boolean('notifications'), _("Show notifications"), _("Display notification on create screenshot"));
        this.ui.settings.notifications.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.settings.page.actor.add(this.ui.settings.notifications);

        this.ui.settings.clipboard = new InputComboBox('clipboard', this.settings.get_string('clipboard'), _("Save to Clipboard"), _("Save file URI or image to Clipboard on create screenshot"), { 'none': _("None"), 'uri': _("URI"), 'image': _("Image"), });
        this.ui.settings.clipboard.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.settings.page.actor.add(this.ui.settings.clipboard);

        this.ui.settings.flash = new InputComboBox('flash', this.settings.get_string('flash'), _("Flash effect"), _("Simulate flash effect on create screenshot"), { 'none': _("None"), 'audio': _("Audio"), 'video': _("Video"), 'both': _("Both"), });
        this.ui.settings.flash.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.settings.page.actor.add(this.ui.settings.flash);

        this.ui.settings.shadows = new InputSwitch('shadows', this.settings.get_boolean('shadows'), _("Window shadows"), _("Include shadows in Window screenshot"));
        this.ui.settings.shadows.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.settings.page.actor.add(this.ui.settings.shadows);

        return this.ui.settings.page;
    },

    /**
     * Create new storage page
     *
     * @return {Object}
     */
    _page_storage: function() {
        this.ui.storage = {};
        this.ui.storage.page = this._page();
        this.ui.storage.page.get_style_context().add_class('screengrabber-prefs-page-storage');

        this.ui.storage.filename_template = new InputEntry('filename-template', this.settings.get_string('filename-template'), _("Filename template"), _("Screenshot filename template"));
        this.ui.storage.filename_template.actor.set_orientation(Gtk.Orientation.VERTICAL);
        this.ui.storage.filename_template._widget.secondary_icon_name = 'dialog-question-symbolic';
        this.ui.storage.filename_template._widget.connect('icon-press', Lang.bind(this, this._handle_help));
        this.ui.storage.filename_template.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.storage.page.actor.add(this.ui.storage.filename_template);

        this.ui.storage.upload_provider = new InputComboBox('upload-provider', this.settings.get_string('upload-provider'), _("Upload provider"), _("Upload provider"), Provider.list(true));
        this.ui.storage.upload_provider.connect('changed', Lang.bind(this, this._handle_widget));
        this.ui.storage.page.actor.add(this.ui.storage.upload_provider);

        return this.ui.storage.page;
    },

    /**
     * Create new key bindings page
     *
     * @return {Object}
     */
    _page_keybinds: function() {
        this.ui.keybinds = {};
        this.ui.keybinds.page = this._page();
        this.ui.keybinds.page.get_style_context().add_class('screengrabber-prefs-page-keybinds');

        let model = new Gtk.ListStore();
        model.set_column_types([
            GObject.TYPE_STRING,
            GObject.TYPE_STRING,
            GObject.TYPE_INT,
            GObject.TYPE_INT,
        ]);

        this.ui.keybinds.treeview = new Gtk.TreeView({
            expand: true,
            model: model,
        });
        this.ui.keybinds.page.actor.add(this.ui.keybinds.treeview);

        let render, column;
        render = new Gtk.CellRendererText();
        column = new Gtk.TreeViewColumn({
          title: _("Screenshot Action"),
          expand: true,
        });
        column.pack_start(render, true);
        column.add_attribute(render, 'text', 1);
        this.ui.keybinds.treeview.append_column(column);

        render = new Gtk.CellRendererAccel({
            editable: true,
            accel_mode: Gtk.CellRendererAccelMode.GTK,
        });
        render.connect('accel-edited', Lang.bind(this, this._handle_shortcut_edited));
        render.connect('accel-cleared', Lang.bind(this, this._handle_shortcut_cleared));
        column = new Gtk.TreeViewColumn({
            title: _("Shortcut"),
            min_width: 180,
        });
        column.pack_end(render, false);
        column.add_attribute(render, 'accel-mods', 2);
        column.add_attribute(render, 'accel-key', 3);
        this.ui.keybinds.treeview.append_column(column);

        let shortcut = [
            //[ 'name', 'value', ],
            [ 'shortcut-desktop', _("Desktop"), ],
            [ 'shortcut-monitor', _("Monitor"), ],
            [ 'shortcut-window', _("Window"), ],
            [ 'shortcut-selection', _("Selection"), ],
        ];
        for (let [ name, value ] of shortcut) {
            let bind = this.settings.get_strv(name)[0];
            let row = model.append();
            let [ key, mods ] = bind ? Gtk.accelerator_parse(bind) : [ 0, 0 ];

            model.set(row, [ 0, 1, 2, 3 ], [ name, value, mods, key ]);
        }

        return this.ui.keybinds.page;
    },

    /**
     * Create new about page
     *
     * @return {Object}
     */
    _page_about: function() {
        this.ui.about = {};
        this.ui.about.page = this._page();
        this.ui.about.page.get_style_context().add_class('screengrabber-prefs-page-about');

        this.ui.about.title = new Label({ label: Me.metadata.name, });
        this.ui.about.title.get_style_context().add_class('screengrabber-prefs-page-about-title');
        this.ui.about.page.actor.add(this.ui.about.title);

        let ico = GdkPixbuf.Pixbuf.new_from_file_at_scale(Me.path + '/assets/%s.svg'.format(Icons.DEFAULT), 64, 64, null);
        this.ui.about.icon = Gtk.Image.new_from_pixbuf(ico);
        this.ui.about.icon.get_style_context().add_class('screengrabber-prefs-page-about-icon');
        this.ui.about.page.actor.add(this.ui.about.icon);

        this.ui.about.desc = new Label({ label: Me.metadata['description-html'] || Me.metadata.description, });
        this.ui.about.desc.get_style_context().add_class('screengrabber-prefs-page-about-description');
        this.ui.about.page.actor.add(this.ui.about.desc);

        this.ui.about.version = new Label({ label: _("Version") + ': ' + Me.metadata.version, });
        this.ui.about.version.get_style_context().add_class('screengrabber-prefs-page-about-version');
        this.ui.about.page.actor.add(this.ui.about.version);

        this.ui.about.author = new Label({ label: Me.metadata['original-author-html'] || Me.metadata['original-author'], });
        this.ui.about.author.get_style_context().add_class('screengrabber-prefs-page-about-author');
        this.ui.about.page.actor.add(this.ui.about.author);

        this.ui.about.webpage = new Label({ label: '<a href="' + Me.metadata.url + '">' + Me.metadata.url + '</a>', });
        this.ui.about.webpage.get_style_context().add_class('screengrabber-prefs-page-about-webpage');
        this.ui.about.page.actor.add(this.ui.about.webpage);

        this.ui.about.license = new Label({ label: Me.metadata['license-html'] || Me.metadata.license, });
        this.ui.about.license.get_style_context().add_class('screengrabber-prefs-page-about-license');
        this.ui.about.page.actor.pack_end(this.ui.about.license, false, false, 0);

        return this.ui.about.page;
    },

    /**
     * Settings input widget help click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_help: function(actor, event) {
        File.launch('https://github.com/fffilo/screengrabber/blob/master/SAVING.md');
    },

    /**
     * Settings input widget change event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_widget: function(actor, event) {
        let old_value = this.settings['get_' + event.type](event.key);

        if (old_value != event.value)
            this.settings['set_' + event.type](event.key, event.value);
    },

    /**
     * Settings changed event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_settings: function(actor, event) {
        // pass
    },

    /**
     * Shortcut (cell-renderer-accel) edited event handler
     *
     * @param  {Object} actor
     * @param  {String} path
     * @param  {Number} key
     * @param  {Number} mods
     * @return {Void}
     */
    _handle_shortcut_edited: function(actor, path, key, mods) {
        let value = Gtk.accelerator_name(key, mods);
        let model = this.ui.keybinds.treeview.get_model();
        let [ ok, iter ] = model.get_iter_from_string(path);
        let name = model.get_value(iter, 0);
        let warning = false;

        // don't allow key tab or key without ctrl/alt/super
        if (value.match(/<Tab>/gi) || !value.match(/<Primary>|<Alt>|<Super>/gi))
            warning = _("The shortcut \"%s\" cannot be used.").format(value);

        // don't allow duplicates
        let actions = [ 'shortcut-desktop', 'shortcut-monitor', 'shortcut-window', 'shortcut-selection' ];
        for (let i in actions) {
            if (actions[i] === name)
                continue;

            if (this.settings.get_strv(actions[i])[0] === value) {
                warning = _("The shortcut \"%s\" already in use.").format(value);
                break;
            }
        }

        // display warning dialog
        if (warning) {
            let dlg = new Gtk.MessageDialog({
                transient_for: this.get_toplevel(),
                modal: true,
                buttons: Gtk.ButtonsType.OK,
                message_type: Gtk.MessageType.WARNING,
                text: warning,
            });
            dlg.run();
            dlg.destroy();

            return;
        }

        // set
        model.set(iter, [ 2, 3 ], [ mods, key ]);
        this.settings.set_strv(name, [value]);
    },

    /**
     * Shortcut (cell-renderer-accel) cleared event handler
     *
     * @param  {Object} actor
     * @param  {String} path
     * @param  {Number} key
     * @param  {Number} mods
     * @return {Void}
     */
    _handle_shortcut_cleared: function(actor, path, key, mods) {
        let model = this.ui.keybinds.treeview.get_model();
        let [ ok, iter ] = model.get_iter_from_string(path);
        let name = model.get_value(iter, 0);

        model.set(iter, [ 2, 3 ], [ 0, 0 ]);
        this.settings.set_strv(name, []);
    },

    /* --- */

});

/**
 * Box constructor
 * extends Gtk.Frame
 *
 * used so we can use padding
 * property in css
 *
 * to add widget to Box use
 * actor
 *
 * @param  {Object}
 * @return {Object}
 */
const Box = new GObject.Class({

    Name: 'Prefs.Box',
    GTypeName: 'ScreenGrabberPrefsBox',
    Extends: Gtk.Frame,

    _init: function() {
        this.parent();

        this.actor = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, });
        this.add(this.actor);
    },

    /* --- */

});

/**
 * Label constructor
 * extends Gtk.Label
 *
 * just a common Gtk.Label object
 * with markup and line wrap
 *
 * @param  {Object}
 * @return {Object}
 */
const Label = new GObject.Class({

    Name: 'Prefs.Label',
    GTypeName: 'ScreenGrabberPrefsLabel',
    Extends: Gtk.Label,

    /**
     * Constructor
     *
     * @param  {Object} options (optional)
     * @return {Void}
     */
    _init: function(options) {
        let o = options || {};
        if (!('label' in options)) o.label = 'undefined';

        this.parent(o);
        this.set_markup(this.get_text());
        this.set_line_wrap(true);
        this.set_justify(Gtk.Justification.CENTER);
    },

    /* --- */

});

/**
 * Input constructor
 * extends Box
 *
 * horizontal Gtk.Box object with label
 * and widget for editing settings
 *
 * @param  {Object}
 * @return {Object}
 */
const Input = new GObject.Class({

    Name: 'Prefs.Input',
    GTypeName: 'ScreenGrabberPrefsInput',
    Extends: Box,

    /**
     * Constructor
     *
     * @param  {String} key
     * @param  {String} text
     * @param  {String} tooltip
     * @return {Void}
     */
    _init: function(key, text, tooltip) {
        this.parent();
        this.actor.set_orientation(Gtk.Orientation.HORIZONTAL);

        let eb = new Gtk.EventBox();
        eb.set_visible_window(false);
        eb.connect('button-press-event', Lang.bind(this, this._handle_label));
        this.actor.pack_start(eb, true, true, 0);

        this._key = key;
        this._widget = null;
        this._label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip || '' });
        eb.add(this._label);
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.value;
    },

    /**
     * Value setter
     *
     * @param  {Mixed} value
     * @return {Void}
     */
    set value(value) {
        this._widget.value = value;
    },

    /**
     * Label click event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_label: function(actor, event) {
        if (!this._widget)
            return;
        //if (!this._widget.get_can_focus())
        //    return;

        this._widget.grab_focus();
    },

    /**
     * Input change event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_change: function(actor, event) {
        this.emit('changed', {
            key: this._key,
            value: actor.value,
            type: typeof actor.value,
        });
    },

    /* --- */

});

Signals.addSignalMethods(Input.prototype);

/**
 * InputSwitch constructor
 * extends Input
 *
 * @param  {Object}
 * @return {Object}
 */
const InputSwitch = new GObject.Class({

    Name: 'Prefs.InputSwitch',
    GTypeName: 'ScreenGrabberPrefsInputSwitch',
    Extends: Input,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.Switch({ active: value });
        this._widget.connect('notify::active', Lang.bind(this, this._handle_change));
        this.actor.add(this._widget);
    },

    /**
     * Input change event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_change: function(actor) {
        this.emit('changed', {
            key: this._key,
            value: this.value,
            type: 'boolean',
        });
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.active;
    },

    /**
     * Value setter
     *
     * @param  {Boolean} value
     * @return {Void}
     */
    set value(value) {
        this._widget.active = value;
    },

    /* --- */

});

/**
 * InputComboBox constructor
 * extends Gtk.Box
 *
 * @param  {Object}
 * @return {Object}
 */
const InputComboBox = new GObject.Class({

    Name: 'Prefs.InputComboBox',
    GTypeName: 'ScreenGrabberPrefsInputComboBox',
    Extends: Input,

    /**
     * ComboBox initialization
     *
     * @param  {String} key
     * @param  {Mixed}  value
     * @param  {String} text
     * @param  {String} tooltip
     * @param  {Object} options
     * @return {Void}
     */
    _init: function(key, value, text, tooltip, options) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.ComboBoxText();
        this._widget.connect('notify::active', Lang.bind(this, this._handle_change));
        this.actor.add(this._widget);

        for (let id in options) {
            this._widget.append(id, options[id]);
        }

        this.value = value;
    },

    /**
     * Widget change event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_change: function(actor, event) {
        this.emit('changed', {
            key: this._key,
            value: this.value,
            type: 'string'
        });
    },

    /**
     * Value getter
     *
     * @return {Boolean}
     */
    get value() {
        return this._widget.get_active_id();
    },

    /**
     * Value setter
     *
     * @param  {Boolean} value
     * @return {Void}
     */
    set value(value) {
        this._widget.set_active_id(value);
    },

    /* --- */

});

/**
 * InputEntry constructor
 * extends Input
 *
 * @param  {Object}
 * @return {Object}
 */
const InputEntry = new GObject.Class({

    Name: 'Prefs.InputEntry',
    GTypeName: 'ScreenGrabberPrefsInputEntry',
    Extends: Input,

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function(key, value, text, tooltip) {
        this.parent(key, text, tooltip);

        this._widget = new Gtk.Entry({ text: value });
        this._widget.connect('notify::text', Lang.bind(this, this._handle_change));
        this.actor.add(this._widget);
    },

    /**
     * Input change event handler
     *
     * @param  {Object} actor
     * @param  {Object} event
     * @return {Void}
     */
    _handle_change: function(actor, event) {
        this.emit('changed', {
            key: this._key,
            value: this.value,
            type: 'string',
        });
    },

    /**
     * Value getter
     *
     * @return {String}
     */
    get value() {
        return this._widget.text;
    },

    /**
     * Value setter
     *
     * @param  {String} value
     * @return {Void}
     */
    set value(value) {
        this._widget.text = value;
    },

    /* --- */

});
