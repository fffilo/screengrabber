/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

// strict mode
'use strict';

// import modules
const Lang = imports.lang;
const Soup = imports.gi.Soup;
const Signals = imports.signals;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const File = Me.imports.file;
const Provider = Me.imports.provider;

/**
 * User agent
 *
 * @type {String}
 */
const USER_AGENT = '%s_v%s'.format(Me.metadata.name, Me.metadata.version);

/**
 * Base constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const Base = new Lang.Class({

    Name: 'Provider.Base',

    /**
     * Provider webpage
     *
     * @type {String}
     */
    url: 'https://api.dummy.org',

    /**
     * Title (displayed in preferences)
     *
     * @type {String}
     */
    title: 'Dummy Provider',

    /**
     * Description
     *
     * @type {String}
     */
    desc: 'Dummy Provider',

    /**
     * API URL
     *
     * @type {String}
     */
    api: 'https://api.dummy.org/v1',

    /**
     * Constructor
     *
     * @return {Void}
     */
    _init: function() {
        this._session = new Soup.SessionAsync();
    },

    /**
     * Destructor
     *
     * @return {Void}
     */
    destroy: function() {
        this.cancel();
    },

    /**
     * Cancel request
     *
     * @return {Void}
     */
    cancel: function() {
        this._session.abort();
    },

    /**
     * Upload image
     *
     * @param  {String} path
     * @return {Void}
     */
    upload: function(path) {
        let message = this._request_multipart({ image: '@' + path });
        this._queue(message);
    },

    /**
     * Send request
     *
     * @param  {Object} message
     * @return {Void}
     */
    _queue: function(message) {
        this._session.queue_message(message, Lang.bind(this, this._handle_message));
    },

    /**
     * Prepare request:
     * append headers and bind signals
     *
     * @param  {Object} message
     * @param  {Object} headers (optional)
     * @return {Void}
     */
    _request_prepare: function(message, headers) {
        for (let key in headers || {}) {
            message.request_headers.append(key, headers[key]);
        }
        if (!('User-Agent' in (headers || {})))
            message.request_headers.append('User-Agent', USER_AGENT);

        message.connect('got-headers', Lang.bind(this, this._handle_message_got_headers));
        message.connect('got-body', Lang.bind(this, this._handle_message_got_body));
    },

    /**
     * Create multipart request (soup message)
     *
     * @param  {Object} params  (optional)
     * @param  {Object} headers (optional)
     * @return {Object}
     */
    _request_multipart: function(params, headers) {
        let multipart = new Soup.Multipart(Soup.FORM_MIME_TYPE_MULTIPART);
        for (let key in params || {}) {
            if (params[key].substr(0, 1) === '@') {
                let filename = params[key].substr(1);
                let basename = File.basename(filename);
                let mimetype = File.mimetype(filename);
                let contents = File.contents(filename);
                let buffer = new Soup.Buffer(contents, contents.length);

                multipart.append_form_file(key, basename, mimetype, buffer);
            }
            else {
                multipart.append_form_string(key, params[key]);
            }
        }

        let message = Soup.form_request_new_from_multipart(this.api, multipart);
        this._request_prepare(message, headers);

        return message;
    },

    /**
     * Create json request (soup message)
     *
     * @param  {Object} params  (optional)
     * @param  {Object} headers (optional)
     * @return {Object}
     */
    _request_json: function(params, headers) {
        let data = JSON.stringify(params || {});
        let message = Soup.Message.new('post', this.api);
        message.set_request('application/json', Soup.MemoryUse.COPY, data, data.length);
        this._request_prepare(message, headers);

        return message;
    },

    /**
     * Event object
     *
     * @param  {Object} message (optional)
     * @return {Object}
     */
    _event: function(message) {
        let result = {
            success: null,
            status: {
                code: null,
                description: null,
            },
            provider: {
                title: this.title,
                url: this.url,
            },
            data: {},
        }

        if (message) {
            result.status.code = message.status_code;
            result.status.description = Soup.Status.get_phrase(message.status_code)
        }

        return result;
    },

    /**
     * Event (success) object
     *
     * @param  {Object} message (optional)
     * @return {Object}
     */
    _event_success: function(message) {
        let event = this._event(message);
        event.success = true;
        event.data = {
            image: null,
            preview: null,
            delete: null,
        }

        return event;
    },

    /**
     * Event (error) object
     *
     * @param  {Object} message (optional)
     * @return {Object}
     */
    _event_error: function(message) {
        let event = this._event(message);
        event.success = false;
        event.data = {
            error: 'Unknown error',
        }

        return event;
    },

    //_request_xml
    //_request_???

    /**
     * Session request finish event handler
     *
     * @param  {Object} session
     * @param  {Object} message
     * @param  {Object} data
     * @return {Void}
     */
    _handle_message: function(session, message, data) {
        if (typeof this['_handle_message_' + message.status_code] === 'function')
            if (this['_handle_message_' + message.status_code](message) === false)
                return;

        this._handle_message_all(message);
    },

    /**
     * Session callback for status code 200
     *
     * @param  {Object} message
     * @return {Void}
     * /
    _handle_message_200: function(message) {
        // pass
    },

    /**
     * Session callback
     *
     * @param  {Object} message
     * @return {Void}
     */
    _handle_message_all: function(message) {
        let event = this._event(message);

        try {
            if (message.status_code === Soup.Status.OK)
                event = this._event_success(message);
            else
                throw '';
        }
        catch(e1) {
            try {
                event = this._event_error(message);
            }
            catch(e2) {
                event = this._event(message);
                event.success = false;
                event.data.error = 'Unable to parse error message from response';
            }
        }

        return this.emit('done', event);
    },

    /**
     * Request got-headers signal event handler
     *
     * @param  {Object} message
     * @return {Void}
     */
    _handle_message_got_headers: function(message) {
        // pass
    },

    /**
     * Request got-body signal event handler
     *
     * @param  {Object} message
     * @return {Void}
     */
    _handle_message_got_body: function(message) {
        // pass
    },

});

Signals.addSignalMethods(Base.prototype);

/**
 * Provider None constructor
 *
 * @param  {Object}
 * @return {Object}
 */
const None = new Lang.Class({

    Name: 'Provider.None',
    Extends: Base,

    url: '',
    title: 'none',
    desc: '',
    api: '',

    upload: function(path) {
        let event = this._event();
        event.data.preview = File.to_uri(path);
        event.data.image = event.data.preview;

        return this.emit('done', event);
    },

});

/**
 * Provider Imgur constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -H "Authorization: Client-ID 47b3024ef07c33c" -F image="@test.png" -F type="file" https://api.imgur.com/3/image
 * {"data":{"id":"uZNdb5I","title":null,"description":null,"datetime":1503577337,"type":"image\/png","animated":false,"width":1086,"height":611,"size":16372,"views":0,"bandwidth":0,"vote":null,"favorite":false,"nsfw":null,"section":null,"account_url":null,"account_id":0,"is_ad":false,"in_most_viral":false,"tags":[],"ad_type":0,"ad_url":"","in_gallery":false,"deletehash":"2cZFgTQhdjHPBe7","name":"","link":"http:\/\/i.imgur.com\/uZNdb5I.png"},"success":true,"status":200}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -H "Authorization: Client-ID 47b3024ef07c33c" -F invalid="@test.png" -F type="file" https://api.imgur.com/3/image
 * {"data":{"error":"No image data was sent to the upload api","request":"\/3\/image","method":"POST"},"success":false,"status":400}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -H "Authorization: Client-ID 47b3024ef07c33c" -F image="@invalid.png" -F type="file" https://api.imgur.com/3/image
 * {"data":{"error":{"code":1003,"message":"File type invalid (1)","type":"ImgurException","exception":[]},"request":"\/3\/image","method":"POST"},"success":false,"status":400}
 *
 * @param  {Object}
 * @return {Object}
 */
const Imgur = new Lang.Class({

    Name: 'Provider.Imgur',
    Extends: Base,

    url: 'https://imgur.com',
    title: 'imgur',
    desc: 'The most awesome images on the Internet',
    api: 'https://api.imgur.com/3/image',
    clientId: '47b3024ef07c33c',

    upload: function(path) {
        let params = {
            image: '@' + path,
            //album: '',
            type: 'file',
            //name: '',
            //title: '',
            //description: '',
        };
        let headers = {
            Authorization: 'Client-ID %s'.format(this.clientId),
        };

        let message = this._request_multipart(params, headers);
        this._queue(message);
    },

    _event_success: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.preview = response.data.link;
        event.data.image = event.data.preview;
        event.data.delete = '%s/%s'.format(this.api, response.data.deletehash);

        return event;
    },

    _event_error: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.error = response.data.error.message || response.data.error || event.data.error;

        return event;
    },

});

/**
 * Provider Imgbin constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@test.png" https://imagebin.ca/upload.php
 * status:3Xz7Ye1d92nm
 * url:https://ibin.co/3Xz7Ye1d92nm.png
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" https://imagebin.ca/upload.php
 * status:error:The uploaded file was either not present or did not complete.
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@invalid.png" https://imagebin.ca/upload.php
 * status:3Xz7apWnGDVO
 *
 * @param  {Object}
 * @return {Object}
 */
const Imgbin = new Lang.Class({

    Name: 'Provider.Imgbin',
    Extends: Base,

    url: 'https://imagebin.ca',
    title: 'imgbin',
    desc: 'Somewhere to Store Random Things',
    api: 'https://imagebin.ca/upload.php',

    upload: function(path) {
        let message = this._request_multipart({ file: '@' + path });
        this._queue(message);
    },

    _event_success: function (message) {
        let event = this.parent(message);
        event.data.preview = message.response_body.data.match(/(^|\n)url:(.*)?(\n|$)/)[2];
        event.data.image = event.data.preview;

        return event;
    },

    _event_error: function(message) {
        let event = this.parent(message);
        event.data.error = message.response_body.data.match(/(^|\n)status:error:(.*)?(\n|$)/)[2];

        return event;
    },

});

/**
 * Provider UploadsIm constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@test.png" http://uploads.im/api
 * {"status_code":200,"status_txt":"OK","data":{"img_name":"ZQm4W.png","img_url":"http:\/\/sj.uploads.im\/ZQm4W.png","img_view":"http:\/\/uploads.im\/ZQm4W.png","img_width":"1086","img_height":"611","img_attr":"width=\"1086\" height=\"611\"","img_size":"16 KB","img_bytes":16372,"thumb_url":"http:\/\/sj.uploads.im\/t\/ZQm4W.png","thumb_width":360,"thumb_height":203,"source":"base64 image string","resized":"0","delete_key":"935ab2c8366af631"}}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" http://uploads.im/api
 * {"status_code":200,"status_txt":"OK","data":{"img_name":"Ls5n0.png","img_url":"http:\/\/sm.uploads.im\/Ls5n0.png","img_view":"http:\/\/uploads.im\/Ls5n0.png","img_width":"1086","img_height":"611","img_attr":"width=\"1086\" height=\"611\"","img_size":"16 KB","img_bytes":16372,"thumb_url":"http:\/\/sm.uploads.im\/t\/Ls5n0.png","thumb_width":360,"thumb_height":203,"source":"base64 image string","resized":"0","delete_key":"9f62ca6e7f227cdb"}}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@invalid.png" http://uploads.im/api
 * {"status_code":403,"status_txt":"invalid image"}
 *
 * @param  {Object}
 * @return {Object}
 */
const UploadsIm = new Lang.Class({

    Name: 'Provider.UploadsIm',
    Extends: Base,

    url: 'http://uploads.im',
    title: 'uploads.im',
    desc: 'Uploads.im Image Hosting. Would you like to upload an image?',
    api: 'http://uploads.im/api',

    upload: function(path) {
        let message = this._request_multipart({ file: '@' + path });
        this._queue(message);
    },

    _event_success: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.preview = response.data.img_view;
        event.data.image = response.data.img_url || event.data.preview;

        return event;
    },

    _event_error: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.error = response.status_txt || event.data.error;

        return event;
    },

});

/**
 * Provider AnonImage constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F imgulfile[]="@test.png" -D- -o/dev/null https://anonimage.net/upload_magick.php
 * HTTP/1.1 302 Found
 * Date: Thu, 24 Aug 2017 13:44:57 GMT
 * Server: Apache/2.4.7 (Ubuntu)
 * location: view/v1iWCxeDYM
 * Content-Length: 6
 * Content-Type: text/html
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid[]="@test.png" -D- -o/dev/null https://anonimage.net/upload_magick.php
 * HTTP/1.1 302 Found
 * Date: Thu, 24 Aug 2017 13:45:47 GMT
 * Server: Apache/2.4.7 (Ubuntu)
 * location: view/
 * Content-Length: 0
 * Content-Type: text/html
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F imgulfile[]="@invalid.png" -D- -o/dev/null https://anonimage.net/upload_magick.php
 * HTTP/1.1 302 Found
 * Date: Thu, 24 Aug 2017 13:48:10 GMT
 * Server: Apache/2.4.7 (Ubuntu)
 * location: view/9StpDaRCtL
 * Content-Length: 6
 * Content-Type: text/html
 *
 * @param  {Object}
 * @return {Object}
 */
const AnonImage = new Lang.Class({

    Name: 'Provider.AnonImage',
    Extends: Base,

    url: 'https://anonimage.net',
    title: 'AnonImage',
    desc: 'Anonymous Image Hosting',
    api: 'https://anonimage.net/upload_magick.php',

    upload: function(path) {
        this._got_headers = false;

        let message = this._request_multipart({ 'imgulfile[]': '@' + path });
        message.set_flags(Soup.MessageFlags.NO_REDIRECT);
        this._queue(message);
    },

    _event_success: function(message) {
        let event = this.parent(message);
        event.data.preview = '%s/%s'.format(this.url, message.response_headers.get('location'));
        event.data.image = event.data.preview;

        return event;
    },

    _event_error: function(message) {
        if (message.status_code === Soup.Status.FOUND)
            return this._event_success(message);

        return this.parent(message);
    },

    _handle_message_1: function(message) {
        return !this._got_headers;
    },

    _handle_message_got_headers: function(message) {
        this._got_headers = true;

        this._handle_message_all(message);
        this.cancel();
    },

});

/**
 * Provider Unsee constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F image[]="@test.png" -F time="86400" https://unsee.cc/upload
 * {"hash":"bopenugi"}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" -F time="86400" https://unsee.cc/upload
 * {"hash":"dorusame"}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F image[]="@invalid.png" -F time="86400" https://unsee.cc/upload
 * {"error":"The file is not an image"}
 *
 * @param  {Object}
 * @return {Object}
 */
const Unsee = new Lang.Class({

    Name: 'Provider.Unsee',
    Extends: Base,

    url: 'https://unsee.cc',
    title: 'Unsee',
    desc: 'Free online private photos sharing',
    api: 'https://unsee.cc/upload',

    upload: function(path) {
        let message = this._request_multipart({ 'image[]': '@' + path, time: '86400' });
        this._queue(message);
    },

    _event_success: function(message) {
        let response = JSON.parse(message.response_body.data);
        if (response.error)
            return this._event_error(message);

        let event = this.parent(message);
        event.data.preview = '%s/%s'.format(this.url, response.hash);
        event.data.image = event.data.preview;

        return event;
    },

    _event_error: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.error = response.error || event.data.error;

        return event;
    },

});

/**
 * Provider DropfileTo constructor
 *
 * Notice: our data servers were terminated, we will add new ones ASAP and resume the service.
 * P.S. Never ever use servers from online.net - the only hosting provider in the world that terminates your servers without any notice ;)
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F files[]="@test.png" https://d1.dropfile.to/upload
 * {"files":["test.png","8FEBfnV","rDxB4mr","16372"],"status":0,"url":"https:\/\/dropfile.to\/8FEBfnV","access_key":"rDxB4mr"}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" https://d1.dropfile.to/upload
 * {"invalid_name":"test.png","invalid_content_type":"application\/octet-stream","invalid_path":"\/tmp\/0049509623","invalid_size":"16372","files":{"1":"M2snzGu","2":"f5Wu4Rv"},"status":2}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F files[]="@invalid.png" https://d1.dropfile.to/upload
 * {"files":["invalid.png","HnvFFTu","YXJFxPo","14"],"status":0,"url":"https:\/\/dropfile.to\/HnvFFTu","access_key":"YXJFxPo"}
 *
 * @param  {Object}
 * @return {Object}
 */
const DropfileTo = new Lang.Class({

    Name: 'Upload.DropfileTo',
    Extends: Base,

    url: 'https://dropfile.to',
    title: 'Dropfile.to',
    desc: '',
    api: 'https://d1.dropfile.to/upload',

    upload: function(path) {
        let message = this._request_multipart({ 'files[]': '' + path });
        this._queue(message);
    },

    _event_success: function(message) {
        let response = JSON.parse(message.response_body.data);
        if (!response.url)
            return this._event_error(message);

        let event = this.parent(message);
        event.data.preview = response.url;
        event.data.image = event.data.preview;

        return event;
    },

    _event_error: function(message) {
        throw '';
    },

});

/**
 * Provider Lutim constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@test.png" -F format="json" -F first-view="0" -F delete-day="30" -F crypt="0" -F keep-exif="0" https://lut.im
 * {"msg":{"created_at":1503583694,"del_at_view":false,"ext":"png","filename":"test.png","limit":"30","real_short":"jgPH7THpEn","short":"jgPH7THpEn\/1YdI5UqYDrRaijwb","thumb":"data:image\/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJcAAABVCAYAAABEv3bGAAAABGdBTUEAALGPC\/xhBQAAACBjSFJN\nAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA\/wD\/AP+gvaeTAAAA\nB3RJTUUH4QgYDggOke7cMwAABkdJREFUeNrt3U1z29YVgOH33AsQpEjJpCjJ9thKFpnONItu2mky\nnSar\/IOu8of78Q9St41rT+0qsWtSFEmAIIB7ugAlS7KcjmPfyrLPs6EoEBB1+eLraiH5w7ff6uzk\nhI+Jqp59LSJnz0Xkrbf5Ntu4aVT1tb\/vrZ0dksl0et3v8f86GP3+gNHwFqqBosiZz5fs3BriCMzm\nCxLvqeoaEUEA5z2oUjcNqIJI+0gbUtM0IMJotEsvS5lMpzRBkc06p\/EG1QtR3zSXdx4BhsMhq9WK\noigA8N7T6\/UoioLJZEISNoPzMQghcPfeJ\/zqF5\/RoGhYs1iu2B\/vUZY505M5XjxBG6qqpNPpAUpo\nKsoq0Ot2SVMHOOqq5Om\/n\/LsxYy98ZjD+5+SSM2yKCjXDYOtLqpKo0riPY8fPeTh4yeIc9c9DG9O\nleFwiHOOyWQCQNpJ+e1vfs0\/Hz3muwcPEBH6\/T6\/+\/IL\/vjnvzBfLJCvvvnm5u5OP2OQur0tsjQF\nEXrdDOc8e\/t7LOczFssCBbx3lKsV4jwi7V4aFNI0ZTwekS+W5EXBcrlkVa5J0g69bkZRFPT7fVSV\nTqeDE1iVa7JOh+Vywcl8cTN3ZFUGgwEiwnw+h81RfTQcUlw6cm1tbZHnOU3TIF9+\/fXHE1c7UrzN\n2enCNVr7jXarm+uPnzr13eTrsauuKVX1whicHweAREO4MEBng4YAyulQna6uL7dyOmJnyzgd3HPL\nztbdvC5sluvpG1UF5MIOfdXH8758LOfj0fPjcGnZ\/1r3prr8O1weg\/OvSdKsy6efHOJUyYucF5MJ\n5bpi\/+CAraxD2ulSrQuePD1CnOfOndskzrHMlzRBKVcFeV7Q6w\/YH49YLJYAOOfw3uNQfnj+HHAc\nHt6nXpeU64ok8ZwGXDeBLPEc\/fgMn3a4c\/sAbWpAaJqa6fEx5bq67nE1bygREeq6Yru\/zd7emDxf\nsiorfOIZbO8w6PdZLn17ZxQC3W6P7f4Wu6MRznt+OHrCMi8IIdAfbDPe3cW5hFCvyVclGhqev3hB\n1QTyVcndgwO0qVARkiSF0JB2epT5jKMfnyEiZJ0O24MxzkEvy\/jrg+9YlesbfVr5GMkXv\/9KBWlv\nvZ0QQkBVcc7hnNucwpTQtI9uc7fTntEENBBUESd45zZ364JqANrHy\/NKL58A2h7lVJUQwoXXJWnK\neHfEbDajKFbXPVbmTYiQZPsnOL+5pnGwmirOw+pYcamQ9qA8UTp9oS4gVIpLNh9+F6pC0QDUpxsF\nPbuME3SdUNcN4lO2bu2DE+oyZ10sSLsDNFTU6+JsPklVybIO3Y4jX8xZdzMyn\/Cf2eyDuGb50Kkq\nKoI4R7JzqIRqcxAJSmcAoYbdz4TBXaGzJZw8DYQaxIFzQnGsdMftOuUx1BVs32mPaEkXtIFqqRw\/\nAiZDVpohaZet4W28d1RlTnsj4UmzDPEp68WEtL8LoSFza3aTnAd\/+wfzkzlpkqBN094MmPeaqqLO\nIUDyrz81aGg\/NA2QdNuJHZ9C8nehuwPL50qzBpcCAaoCxINL2g02JUy\/D+CgNxKKiaINlAtI5Zh1\ntSbb3qM4PqIqC3zaxfkEbWrEJzjnqVYLXJK1xXvhJBWquma0O6aqKiyrm0FEXs4wfP7Lz89dEHE2\nD\/ByyoFX5gEuT0sIr5k+kMt\/f9ps7IrbWbniZ4sI3vtXrsfM+y2cnhZfmUCSCw8\/OcEkr\/n6wmvk\nildduuu7\/LPOL22a5rrHyvxMN\/APXeamsLhMNBaXicbiMtFYXCYai8tEY3GZaCwuE43FZaKxuEw0\nFpeJxuIy0VhcJhqLy0RjcZloLC4TjcVlorG4TDQWl4nG4jLRWFwmGovLRGNxmWgsLhONxWWisbhM\nNBaXicbiMtFYXCYai8tEY3GZaCwuE43FZaKxuEw0FpeJxuIyUYgIyXW\/CfNhaf+n5T3uHx7akcu8\nWwps72xz\/\/49i8u8WwKg7b8+tLhMNBaXicbiMtFYXCYai8tEY3GZaCwuE43FZaKxuEw0FpeJxuIy\n0VhcJhqLy0RjcZloLC4TjcVlorG4TDQWl4nG4jLRWFwmGovLRGNxmWgsLhONxWWisbhMNBaXicbi\nMtFYXCYai8tEY3GZaCwuE4VgcZl3TYTpdMr3Dx\/yXyurnxXi+LP4AAAAJXRFWHRkYXRlOmNyZWF0\nZQAyMDE3LTA4LTI0VDE2OjA4OjE0KzAyOjAwqt0yEwAAACV0RVh0ZGF0ZTptb2RpZnkAMjAxNy0w\nOC0yNFQxNjowODoxNCswMjowMNuAiq8AAAAZdEVYdFNvZnR3YXJlAGdub21lLXNjcmVlbnNob3Tv\nA78+AAAAAElFTkSuQmCC\n","token":"JV2hE5O6sVJbdYDkWdGqXp6c"},"success":true}
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" -F format="json" -F first-view="0" -F delete-day="30" -F crypt="0" -F keep-exif="0" https://lut.im
 * 500
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F file="@invalid.png" -F format="json" -F first-view="0" -F delete-day="30" -F crypt="0" -F keep-exif="0" https://lut.im
 * {"msg":{"filename":"invalid.png","msg":"The file invalid.png is not an image."},"success":false}
 *
 * @param  {Object}
 * @return {Object}
 */
const Lutim = new Lang.Class({

    Name: 'Provider.Lutim',
    Extends: Base,

    url: 'https://lut.im',
    title: 'Lutim',
    desc: 'Let\'s Upload That Image',
    api: 'https://lut.im',

    upload: function(path) {
        let params = {
            'file': '@' + path,
            'format': 'json',
            'first-view': '0',
            'delete-day': '30',
            'crypt': '0',
            'keep-exif': '0',
        }

        let message = this._request_multipart(params);
        this._queue(message);
    },

    _event_success: function(message) {
        let response = JSON.parse(message.response_body.data);
        if (!response.success)
            return this._event_error(message);

        let event = this.parent(message);
        event.data.preview = '%s/%s.%s'.format(this.url, response.msg.short, response.msg.ext);
        event.data.image = event.data.preview;

        return event;
    },

    _event_error: function(message) {
        let response = JSON.parse(message.response_body.data);
        let event = this.parent(message);
        event.data.error = response.msg.msg || event.data.error;

        return event;
    },

});

/**
 * Provider PicPaste constructor
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F upload="@test.png" -F storetime="8" -F addprivacy="1" -F rules="yes" -D- -o/dev/null http://picpaste.com/upload.php
 * HTTP/1.1 200 OK
 * Date: Fri, 25 Aug 2017 08:12:50 GMT
 * Server: Apache/2.2.9 (Debian) PHP/5.2.6-1+lenny16 with Suhosin-Patch mod_ssl/2.2.9 OpenSSL/0.9.8g
 * X-Powered-By: PHP/5.2.6-1+lenny16
 * Set-Cookie: PICPASTE_PRIVACY=1
 * Set-Cookie: PICPASTE_RULES=TRUE
 * Set-Cookie: PICPASTE_RULES_VER=20101001
 * X-salgar-pic: test-MbBfvDA9.png
 * X-salgar-del: oN9l6JFo
 * Vary: Accept-Encoding
 * Content-Length: 6137
 * Connection: close
 * Content-Type: text/html
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F invalid="@test.png" -F storetime="8" -F addprivacy="1" -F rules="yes" -D- -o/dev/null http://picpaste.com/upload.php
 * HTTP/1.1 200 OK
 * Date: Fri, 25 Aug 2017 09:10:05 GMT
 * Server: Apache/2.2.9 (Debian) PHP/5.2.6-1+lenny16 with Suhosin-Patch mod_ssl/2.2.9 OpenSSL/0.9.8g
 * X-Powered-By: PHP/5.2.6-1+lenny16
 * Set-Cookie: PICPASTE_PRIVACY=1
 * Set-Cookie: PICPASTE_RULES=TRUE
 * Set-Cookie: PICPASTE_RULES_VER=20101001
 * X-salgar-err: No picture uploaded
 * Vary: Accept-Encoding
 * Content-Length: 2963
 * Connection: close
 * Content-Type: text/html
 *
 * >>> curl -H "User-Agent: Screengrabber_v1" -F upload="@invalid.png" -F storetime="8" -F addprivacy="1" -F rules="yes" -D- -o/dev/null http://picpaste.com/upload.php
 * HTTP/1.1 200 OK
 * Date: Fri, 25 Aug 2017 08:13:53 GMT
 * Server: Apache/2.2.9 (Debian) PHP/5.2.6-1+lenny16 with Suhosin-Patch mod_ssl/2.2.9 OpenSSL/0.9.8g
 * X-Powered-By: PHP/5.2.6-1+lenny16
 * Set-Cookie: PICPASTE_PRIVACY=1
 * Set-Cookie: PICPASTE_RULES=TRUE
 * Set-Cookie: PICPASTE_RULES_VER=20101001
 * X-salgar-err: Only JP(E)G, PNG, GIF and BMP files are allowed.
 * Vary: Accept-Encoding
 * Content-Length: 2992
 * Connection: close
 * Content-Type: text/html
 *
 * @param  {Object}
 * @return {Object}
 */
const PicPaste = new Lang.Class({

    Name: 'Provider.PicPaste',
    Extends: Base,

    url: 'http://picpaste.com',
    title: 'PicPaste',
    desc: 'Put your pictures online, easy and quick!',
    api: 'http://picpaste.com/upload.php',

    upload: function(path) {
        this._got_headers = false;

        let params = {
            upload: '@' + path,
            storetime: '8',
            addprivacy: '1',
            rules: 'yes',
        }

        let message = this._request_multipart(params);
        this._queue(message);
    },

    _event_success: function(message) {
        let filename = message.response_headers.get('X-salgar-pic');
        if (!filename)
            return this._event_error(message);

        let event = this.parent(message);
        event.data.preview = '%s/%s'.format(this.url, filename);
        event.data.image = event.data.preview;
        event.data.delete = '%s/del/%s/%s'.format(this.url, message.response_headers.get('X-salgar-del'), filename);

        return event;
    },

    _event_error: function(message) {
        let event = this.parent(message);
        event.data.error = message.response_headers.get('X-salgar-err') || event.data.error;

        return event;
    },

    _handle_message_1: function(message) {
        return !this._got_headers;
    },

    _handle_message_got_headers: function(message) {
        this._got_headers = true;

        this._handle_message_all(message);
        this.cancel();
    },

});

/**
 * Check if provider is extended
 * from Base
 *
 * @param  {String}  name
 * @return {Boolean}
 */
const test = function(name) {
    let base = Provider[name];
    while (typeof base === 'function') {
        if ((base = base.__super__) === Base)
            return true;
    }

    return false;
}

/**
 * Get all providers
 *
 * @param  {Boolean} as_obj
 * @return {Object}
 */
const list = function(as_obj) {
    let result = as_obj ? {} : [];
    for (let name in Provider) {
        if (test(name)) {
            if (as_obj)
                result[name] = name;
            else
                result.push(name);
        }
    }

    return result;
}

/**
 * Get provider meta
 *
 * @param  {String} name
 * @param  {String} key  (optional)
 * @return {Object}
 */
const get_meta = function(name, key) {
    if (test(name)) {
        let provider = Provider[name].prototype;
        let result = {
            url: provider.url,
            title: provider.title,
            desc: provider.desc,
            api: provider.api,
        }

        if (key)
            return result[key];

        return result;
    }

    return null;
}

/**
 * Get new provider instance
 *
 * @param  {String} name
 * @return {Object}
 */
const new_by_name = function(name) {
    if (test(name))
        return new Provider[name]();

    return null;
}
