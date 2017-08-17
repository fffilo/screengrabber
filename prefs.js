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

    /**
     * Initialize object properties
     *
     * @return {Void}
     */
    _def: function() {
        this.settings = Settings.settings();
        //this.settings.connect('changed', Lang.bind(this, this._handle_settings));
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
        notebook.append_page(this._page_keybinds(), new Gtk.Label({ label: _("Key Bindings"), }));
        notebook.append_page(this._page_providers(), new Gtk.Label({ label: _("Providers"), }));
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

        this.ui.settings.wip = new Label({ label: 'Work in progress...', });
        this.ui.settings.wip.set_opacity(0.5);
        this.ui.settings.page.actor.add(this.ui.settings.wip);

        return this.ui.settings.page;
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

        this.ui.keybinds.wip = new Label({ label: 'Work in progress...', });
        this.ui.keybinds.wip.set_opacity(0.5);
        this.ui.keybinds.page.actor.add(this.ui.keybinds.wip);

        // work in progress
        return this.ui.keybinds.page;
    },

    /**
     * Create new providers page
     *
     * @return {Object}
     */
    _page_providers: function() {
        this.ui.providers = {};
        this.ui.providers.page = this._page();
        this.ui.providers.page.get_style_context().add_class('screengrabber-prefs-page-providers');

        this.ui.providers.wip = new Label({ label: 'Work in progress...', });
        this.ui.providers.wip.set_opacity(0.5);
        this.ui.providers.page.actor.add(this.ui.providers.wip);

        // work in progress
        return this.ui.providers.page;
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
     * Bind events
     *
     * @return {Void}
     */
    _bind: function() {
        this.connect('destroy', Lang.bind(this, this._handle_destroy));
    },

    /**
     * Widget destroy event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_destroy: function(widget, event) {
        if (this.settings)
            this.settings.run_dispose();
    },

    _handle_widget: function(widget, event) {
        let old_value = this.settings['get_' + event.type](event.key);

        if (old_value != event.value)
            this.settings['set_' + event.type](event.key, event.value);
    },

    /**
     * Settings changed event handler
     *
     * @param  {Object} widget
     * @param  {Object} event
     * @return {Void}
     */
    _handle_settings: function(widget, event) {
        // pass
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
        this.actor.get_style_context().add_class('actor');
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

        this._key = key;
        this._label = new Gtk.Label({ label: text, xalign: 0, tooltip_text: tooltip || '' });
        this._widget = null;

        this.actor.pack_start(this._label, true, true, 0);
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
     * Input change event handler
     *
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', {
            key: this._key,
            value: widget.value,
            type: typeof widget.value,
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
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
        this.emit('changed', {
            key: this._key,
            value: widget.active,
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
     * @param  {Object} widget
     * @return {Void}
     */
    _handle_change: function(widget) {
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
