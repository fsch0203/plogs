var version = "Version 0.0.1";
var _platform = 'pg'; // can also be 'nwjs'
// var plogsdb = TAFFY(); //base database of plogs
var _tagsarray = []; //array of tags for dropdown menu
var _personsarray = []; //array of persons for dropdown menu
var lim = 500;
var start = 0; //start record in query
var _lg;
var _defaultaction = localStorage.getItem("defaultaction");
_defaultaction = (_defaultaction) ? _defaultaction : 'todo';
var _defaultscope = localStorage.getItem("defaultscope");
_defaultscope = (_defaultscope) ? _defaultscope : 'home';
var _lastScrollTop = 0;
var _screenmode = 'small';
var _path = localStorage.getItem("path");
_path = (_path) ? _path : 'res\\files\\';
var _filename = 'plogs.json'
var _activemode = 'list'; // list or edit
var _selectaction = ''; //log, todo, etc, as input for Select()
var _selectscope = ''; //home, work or other, as input for select
var _selecttag = '';
var _selectperson = '';
var _selectdue = {};
var _setdue = '';
var _active_id; //id of selected row
var _locale;
detectLanguage();
_locale = (_locale) ? _locale : "en-US";
_locale = 'nl-NL'; // #### to be deleted
setLanguage();


// Google Drive interaction --------------------------------------------------------------------------
//SCOPES: scopes to request, as a space-delimited string. 
//CLIENT_ID: The app's client ID, found and created in the Google Developers Console.
//DISCOVERY_DOCS: are the apis that we are going to use. An array of discovery doc URLs or discovery doc JSON objects.
var SCOPES = 'https://www.googleapis.com/auth/drive.file';
var CLIENT_ID = '947617816205-mjefkgnmnqn46vs9qhs174p5ctjstoig.apps.googleusercontent.com';
var DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
var API_KEY = 'AIzaSyCiyfyWCbXt5cd5ujXhNOmdCPOQoS13yUE';
var _bm_filename = 'plogs.json';
var _bm_fileid = '';

window.loginService = new LoginService(CLIENT_ID, SCOPES, DISCOVERY_DOCS);
window.driveService = new DriveService();

function initGapi() { //starts after google's api.js is loaded
    gapi.load('client:auth2', initClient);
}

//Try to automactically signin
function initClient() {
    //We pass a callback function to initClient, that return true/false if user is signin/signoff
    window.loginService.initClient(updateSigninStatus)
}

function updateSigninStatus(isSignedIn) { //is called after user is logged in
    if (isSignedIn) {
        // var useremail = window.loginService.userProfile().getEmail();
        // is_auth(useremail)
        // syncWithGD();
    } else {
        not_auth();
    }
}

function syncWithGD() {
    getFileId(_bm_filename, function (fileid) { //get fileid from GD, then
        console.log('sync fileid: ' + fileid);
        if (fileid.length > 10) { // there is a previous version on GD
            getMetaData(fileid, function(modifiedTime){
                console.log('modifiedTime: '+modifiedTime);
                _bm_fileid = fileid;
                getFileContent(fileid, function (filecontent) { // get json from GD
                    var plogsLS = JSON.parse(localStorage.getItem('data'));
                    var recentPlogsLS = $.grep(plogsLS, (function (record, i) {
                        return record.moddate > modifiedTime;
                    }));
                    recentPlogsLS = recentPlogsLS.map(({ // filter out unneccesary fields
                            _id, title, text, scope, due, moddate, action, status 
                        }) => ({ 
                            _id, title, text, scope, due, moddate, action, status }));
                    // console.log('recentplogs' + JSON.stringify(recentplogs));
                    filecontent = removeBom(filecontent); // utf8 without BOM
                    var plogsGD = JSON.parse(filecontent);
                    // console.log('json'+json);
                    
                    recentPlogsLS.forEach((v,i) => {
                        objIndex = plogsGD.findIndex((obj => obj._id == v._id)); // finds index of existing record
                        if (objIndex > -1) {
                            plogsGD[objIndex] = v; // update with recent change
                        } else {
                            plogsGD.push(v); // add new plog
                        }
                    });
                    localStorage.setItem('data', JSON.stringify(plogsGD)); // save to LS
                    saveplogstoGD();
                    showPlogs();
                });
            });
        }
    });
}

function removeBom(string) {
    if (typeof string !== 'string') {
        throw new TypeError(`Expected a string, got ${typeof string}`);
    }
    if (string.charCodeAt(0) === 0xFEFF) { // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string conversion translates it to FEFF (UTF-16 BOM)
        return string.slice(1);
    }
    return string;
};

function signIn() {
    window.loginService.signIn();
}

function signOut() {
    window.loginService.signOut();
}

function is_auth(useremail) {
    console.log('is_auth');
}

function not_auth() {
    console.log('not_auth'); // ask user to signin
}


window.current_file = {
    content: '',
    id: null,
    name: _bm_filename,
    parents: []
};

function saveplogstoLS() {
    var plogs = plogsdb().order("status desc, _id desc").get();
    localStorage.setItem('data', JSON.stringify(plogs));
}

function saveplogstoGD() {
    var plogs = JSON.parse(localStorage.getItem('data'));
    plogs = plogs.map(({ _id, title, text, scope, due, moddate, action, status }) => ({ _id, title, text, scope, due, moddate, action, status }));

    // console.log('plogs: '+JSON.stringify(plogs));

    // var plogs = plogsdb().order("status desc, _id desc").get();
    // console.log('plogs: '+JSON.stringify(plogs));
    window.current_file = {
        content: plogs,
        id: _bm_fileid,
        name: _bm_filename,
        parents: []
    };
    driveService.saveFile(window.current_file, function (file) {
        _bm_fileid = file.id;
    });
}


function getFileContent(fileid, fn) {
    console.log('getFileContent started');
    if (fileid) {
        let file = {
            content: '',
            id: fileid,
            name: _bm_filename,
            parents: []
        };
        
        // let file = window.current_file
        // file = {
        //     id: fileid
        // }
        window.driveService.loadFile(file, function (file) {
            fn(file.content);
        });
    }
}

function getFileId(filename, fn) {
    console.log('getFileId filename: ' + filename);
    window.driveService.listFiles(filename, function (err, files) {
        if (err) {
            console.log('List error:' + err);
            return
        }
        if (Object.keys(files).length === 0) {
            _bm_fileid = '';
            fn('');
        } else {
            _bm_fileid = files[0].id;
            // console.log('_bm_fileid: '+files[0].id);
            fn(files[0].id);
        }
    });
}

function getMetaData(fileId, fn) {
    console.log('getMetaData started');
    var request = gapi.client.request({
        'path': 'https://www.googleapis.com/drive/v3/files/' + fileId,
        'params': {
            'fields': "*"
        },
        'method': 'GET'
    });
    request.execute(function (resp) {
        fn(resp.modifiedTime);
        // console.log('name: ' + resp.name);
        // console.log('Id: ' + resp.id);
        // console.log('description: ' + resp.description);
        // console.log('modifiedTime: ' + resp.modifiedTime);
        // console.log('createdTime: ' + resp.createdTime);
        // console.log('MIME type: ' + resp.mimeType);
        // console.log('size: ' + resp.size);
        // console.log('content: ' + resp.content);
    });
}

// End Google Drive interaction ---------------------------------------------------------






function getdata() { //get json with plogs from local storage; called after document is ready
    $.getJSON('./res/files/plogs.json', function (records) {
        var startData = JSON.stringify(records);
        // console.log('startData: '+startData);
        var json = localStorage.getItem("data");
        json = (json) ? json : startData;
        // json = startData;
        // plogsdb().remove();
        // plogsdb.insert(json);
        localStorage.setItem('data', json);

        showPlogs();
    });

    // var json = localStorage.getItem("data");
    // json = (json) ? json : startData;
    // plogsdb().remove();
    // plogsdb.insert(json);
    // showPlogs();
}

function unique(array) { //returns sorted distinct elements
    var arr = array.filter(function (el, index, arr) {
        return index == arr.indexOf(el);
    });
    return arr.sort();
}

function sortByProperty(objArray, prop, direction) {
    if (arguments.length < 2) throw new Error("Array and object property are not given (sort order is optional)");
    if (!Array.isArray(objArray)) throw new Error("First argument is not an array");
    const clone = objArray.slice(0);
    const direct = arguments.length > 2 ? arguments[2] : 1; //Default to ascending
    const propPath = (prop.constructor === Array) ? prop : prop.split(".");
    clone.sort(function (a, b) {
        for (let p in propPath) {
            if (a[propPath[p]] && b[propPath[p]]) {
                a = a[propPath[p]];
                b = b[propPath[p]];
            }
        }
        // convert numeric strings to integers
        // a = a.match(/^\d+$/) ? +a : a;
        // b = b.match(/^\d+$/) ? +b : b;
        return ((a < b) ? -1 * direct : ((a > b) ? 1 * direct : 0));
    });
    return clone;
}



function setscreen(_activemode) { //_activemode: list or edit
    var w = $("body").width();
    var h = $("body").height();
    // console.log('setscreen + w: ' + _activemode+' '+w);
    var r = (h - 250) / 25;
    $("#itext").css({
        "height": h - 310
    });
    _screenmode = 'small';
    $('.scrollToTop').css({
        'left': '80%'
    });
    $('#addnewplog').css({
        'left': '8%'
    });
    $(".back").show();
    if (_activemode === 'list') { //list
        $(".rs-cube, .rs-bubble").css({
            "right": "1%"
        });
        $("#box0").css({
            "width": "100%",
            "height": "100%"
        });
        $("#box1").css({
            "width": "0%",
            "height": "0%"
        });
        $("header").css({
            "width": "100%"
        });
        $("header").show();
        $("#trashicon").hide();
        // $("#addnewplog").show();
        $('#addnewplog').fadeIn();
    } else { //edit
        $(".rs-cube, .rs-bubble").css({
            "right": "101%"
        }); //rs invisible
        $("#box1").css({
            "width": "100%",
            "height": "100%"
        });
        $("#box0").css({
            "width": "0%",
            "height": "0%"
        });
        $("header").hide();
        // $("addnewplog").hide();
        $('#addnewplog').fadeOut();
        $("#trashicon").show();
    }
}

function makenewplog() { //new button from main screen
    w3_close();
    _active_id = '';
    $("#activelist tr").removeClass("fs-gray");
    setscreen('edit');
    $("#idplog").val('');
    $("#statusplog").val('open');
    $("#actionplog").val(_defaultaction);
    fillactionicon(_defaultaction, '');
    $("input[name='setaction']").val([_defaultaction]);
    $("#itit").text('');
    $("#itext").text('');
    $("#idue").text('');
    $("input[name='setscope']").val([_defaultscope]); // todo: change in last used
    $("#scopeplog").val([_defaultscope]); // todo: change in last used
    // console.log('itit' + ': ' + $("#itit").text());
    $("#itit").focus();
    d = new Date();
    dd = d.toLocaleString(_locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    $("#creationdate").text(dd);
    $("#modificationdate").text(dd);
}

function duplicate() { //new plog from editform with same title)
    saveplog();
    window.setTimeout(function () { //make sure that click event is triggered after focusout event
        $("#idplog").val('');
        $("#statusplog").val('open');
        $("#itext").text('');
        $("#idue").text('');
        fillactionicon($("#actionplog").val(), ''); //set status on open
        $("#itext").focus();
    }, 300);
}

function editplog(id) { //show/edit selected plog
    w3_close();
    $('.scrollToTop').fadeOut();
    _activemode = (_screenmode === 'small') ? 'edit' : 'list';
    setscreen(_activemode);
    // $('#editplog').show();
    var plogsLS = JSON.parse(localStorage.getItem('data'));
    objIndex = plogsLS.findIndex((obj => obj._id == id)); 
    var plog;
    if (objIndex > -1) {
        plog = plogsLS[objIndex];
    }
    // var plog = plogsdb({
    //     _id: id
    // }).get()[0];
    $("#idplog").val(id);
    $("#actionplog").val(plog.action);
    $("#statusplog").val(plog.status);
    $("#scopeplog").val([plog.scope]);
    // console.log('plog.title'+': '+plog.title);
    // var title = mark(plog.title);
    var title = plog.title;
    $("#itit").html(mark(title));
    // var text = mark(plog.text); //get html tags to show colors
    var text = plog.text;
    $("#itext").html(mark(text));
    // console.log(plog.due);
    if (plog.due == 'undefined' || plog.due == '') {
        $("#idue").text('');
    } else {
        _setdue = plog.due;
        d = new Date(plog.due);
        dd = d.toLocaleString(_locale, {
            weekday: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        $("#idue").text(dd);
    }
    if (plog.status === 'trash') {
        $("#trashicon").css('background-image', 'url("../res/img/notrashicon.png")');
    } else {
        $("#trashicon").css('background-image', 'url("../res/img/trashicon.png")');
    }
    // marktext('.editable');
    fillactionicon(plog.action, plog.status);
    $("input[name='setscope']").val([plog.scope]);
    d = new Date(plog._id);
    dd = d.toLocaleString(_locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    $("#creationdate").text(dd);
    d = new Date(plog.moddate);
    dd = d.toLocaleString(_locale, {
        weekday: 'short',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
    $("#modificationdate").text(dd);

    // $("#titleeditform").text(_lg.goeditplogs);
    if (_activemode === 'edit') $("#itit").focus();
}

function mark(text) {
    var ret = text;
    // ret = ret.replace(/<tag[^>]*>|<\/tag[^>]*>/g, "").replace(/<person[^>]*>|<\/person[^>]*>/g, "");
    ret = ret.replace(/([#])([a-z])\w+/gmi, function (a) { //words starting with #
            return '<tag>' + a + '</tag>'; //add tags if word start with #
        })
        .replace(/([@])([a-z])\w+/gmi, function (a) {
            return '<person>' + a + '</person>'; //add <person> if word start with @
        })
        .replace(/(<br>)/gmi, "\n") //needed for next replacement
        .replace(/(^\*\s).*/gmi, function (a) {
            return '<li>' + a.slice(2) + '</li>'; //add <li> if line start with *
        })
        .replace(/(<\/li>\n<li>)/gmi, "</li><li>") //no linefeeds between li-tags
        .replace(/(\n)/gmi, "<br>"); //back to <br>
    // console.log(text);
    // console.log(ret);
    return ret;
}

function unmark(text) {
    var ret = text.replace(/<tag[^>]*>|<\/tag[^>]*>/g, "") //delete orphan tags
        .replace(/<person[^>]*>|<\/person[^>]*>/g, "")
        .replace(/<\/li><li>/g, "</li><br><li>") //get <br>s as we remove <li>s
        .replace(/(<li>(.*?)<\/li>)/g, function (a) {
            return '* ' + a.slice(4, a.length - 5); //replace <li>'s with '* '
        });
    return ret;
}

function saveplog() {
    var title = $("#itit").text(); //no html-codes are saved in title
    if (title.length > 0) {
        var _id = $("#idplog").val();
        var moddate = new Date().toISOString();
        var text = $("#itext").html(); //here .html is needed to handle line breaks (as <div>'s)
        text = unmark(text); //get rid of html-tags (except <br>)
        var due = _setdue;
        var scope = $("#scopeplog").val();
        var action = $("#actionplog").val();
        var status = $("#statusplog").val();
        // console.log('save _id'+': '+_id);
        if (_id === '') {
            addPlog(title, text, scope, action, status, due, moddate);
        } else {
            updatePlog(_id, title, text, scope, action, status, due, moddate);
        }
    } else {
        // alert("Please enter title to save");
        // $("#itit").focus();
    }
}

function addPlog(title, text, scope, action, status, due, moddate) { // save new plog to db
    var _id = new Date().toISOString();
    _active_id = _id;
    // remoteStorage.plogs.savePlog(_id, title, text, scope, action, status);
    var plog = {
        _id: _id,
        title: title,
        text: text,
        due: due,
        moddate: moddate,
        scope: scope, //home, work, other
        action: action, //todo, remind, idea, log
        status: status
    };
    var plogsLS = JSON.parse(localStorage.getItem('data'));
    plogsLS.push(plog);
    // plogsdb.insert(plog);
    // var encrypted = CryptoJS.AES.encrypt(JSON.stringify(plog), _secret) + "";
    // remoteStorage.plogs.savePlog(_id, encrypted);
    $("#idplog").val(_id); //if user continues to edit: no new plog
    // saveplogstoLS();
    localStorage.setItem('data', JSON.stringify(plogsLS)); // save to LS
}

function updatePlog(_id, title, text, scope, action, status, due, moddate) { // save changed plog to db
    _active_id = _id;
    var plogsLS = JSON.parse(localStorage.getItem('data'));
    objIndex = plogsLS.findIndex((obj => obj._id == _active_id)); // finds index of existing record
    var oldplog;
    if (objIndex > -1) {
        oldplog = plogsLS[objIndex];
        // Only update if something has changed
        if (oldplog.title !== title || oldplog.text !== text || oldplog.due !== due ||
            oldplog.scope !== scope || oldplog.action !== action || oldplog.status !== status) {
            moddate = new Date().toISOString();
            var plog = {
                _id: _id,
                title: title,
                text: text,
                due: due,
                moddate: moddate,
                scope: scope, //home, work, other
                action: action, //todo, remind, idea, log
                status: status
            };
            plogsLS[objIndex] = plog; // update with recent change
            localStorage.setItem('data', JSON.stringify(plogsLS)); // save to LS
        }
    }
}

function deleteplog(id) {
    remoteStorage.plogs.removePlog(id);
    var plogs = plogsdb({
        _id: id
    }).remove();
    console.log('# plogs removed' + ': ' + JSON.stringify(plogs));
    saveplogstoLS();
    redrawPlogs();
}

function fillactionicon(action, status) { //show action and status in editform
    $("#log-sym").attr('xlink:href', '#log-symbol-gray'); //log-symbol-gray, log-symbol (black) or log-ch-gray (black + redcheck)
    $("#todo-sym").attr('xlink:href', '#todo-symbol-gray');
    $("#remind-sym").attr('xlink:href', '#remind-symbol-gray');
    $("#idea-sym").attr('xlink:href', '#idea-symbol-gray');
    $("#target-sym").attr('xlink:href', '#target-symbol-gray');
    $("#get-sym").attr('xlink:href', '#get-symbol-gray');
    switch (action) {
        case 'log':
            if (status === 'done') {
                $("#log-sym").attr('xlink:href', '#log-ch-symbol');
            } else {
                $("#log-sym").attr('xlink:href', '#log-symbol');
            }
            break;
        case 'todo':
            if (status === 'done') {
                $("#todo-sym").attr('xlink:href', '#todo-ch-symbol');
            } else {
                $("#todo-sym").attr('xlink:href', '#todo-symbol');
            }
            break;
        case 'remind':
            if (status === 'done') {
                $("#remind-sym").attr('xlink:href', '#remind-ch-symbol');
            } else {
                $("#remind-sym").attr('xlink:href', '#remind-symbol');
            }
            break;
        case 'idea':
            if (status === 'done') {
                $("#idea-sym").attr('xlink:href', '#idea-ch-symbol');
            } else {
                $("#idea-sym").attr('xlink:href', '#idea-symbol');
            }
            break;
        case 'target':
            if (status === 'done') {
                $("#target-sym").attr('xlink:href', '#target-ch-symbol');
            } else {
                $("#target-sym").attr('xlink:href', '#target-symbol');
            }
            break;
        case 'get':
            if (status === 'done') {
                $("#get-sym").attr('xlink:href', '#get-ch-symbol');
            } else {
                $("#get-sym").attr('xlink:href', '#get-symbol');
            }
            break;
    }
}

// Queries -----------------------------------------------------------------
// -------------------------------------------------------------------------
function showPlogs() {
    var plogs = JSON.parse(localStorage.getItem('data'));
    plogs = $.grep(plogs, (function (record, i) {
        return record.status != 'trash';
    }));
    // plogs = sortByProperty(plogs, 'moddate', -1);
    // console.log('plogs: '+JSON.stringify(plogs));


    // var plogs = plogsdb({
    //     status: {
    //         "!is": "trash"
    //     }
    // }).order("_id desc").get();
    // console.log('count #' + ': ' + plogsdb().count());
    $("#trashicon").css('background-image', 'url("../res/img/trashicon.png")');
    // redrawPlogs(plogs);
    Select();
    redrawMenu(plogs);
}

function showTrash() {
    var plogsLS = JSON.parse(localStorage.getItem('data'));
    var plogs = $.grep(plogsLS, (function (record, i) {
        return record.status == 'trash';
    }));
    plogs = sortByProperty(plogs, 'datum', -1);
    // var plogs = plogsdb({
    //     status: {
    //         "is": "trash"
    //     }
    // }).order("_id desc").get();
    // console.log('#' + ': ' + plogsdb().count());
    $("#trashicon").css('background-image', 'url("../res/img/notrashicon.png")');
    redrawPlogs(plogs);
}

function Select() {
    var plogs = JSON.parse(localStorage.getItem('data'));
    plogs = $.grep(plogs, (function (record, i) {
        return record.status != 'trash';
    }));
    plogsdb = TAFFY(plogs);
    var filter = $("#myFilter").val(); //quick search
    var st = start * lim;
    // var plogs;
    plogs = plogsdb({
        status: {
            '!is': 'trash'
        },
        action: {
            likenocase: _selectaction
        },
        due: _selectdue,
        scope: {
            likenocase: _selectscope
        }
    }, [{
        title: {
            likenocase: _selecttag
        }
    }, {
        text: {
            likenocase: _selecttag
        }
    }], [{
        title: {
            likenocase: _selectperson
        }
    }, {
        text: {
            likenocase: _selectperson
        }
    }], [{
        title: {
            likenocase: filter
        }
    }, {
        text: {
            likenocase: filter
        }
        // }]).order('status desc, _id desc').start(st).limit(lim).get();
    }]).order('status desc, moddate desc').start(st).limit(lim).get();
    // console.log('plogs' + ': ' + JSON.stringify(plogs));
    $("#trashicon").css('background-image', 'url("../res/img/trashicon.png")');
    redrawPlogs(plogs);
}

function redrawPlogs(plogs) { //make list after query (Select())
    var list = '';
    var d, dd, due, dued, match1, match2, text;
    var reg1 = /\B\@\w+/g; //all words starting with #
    var reg2 = /\B\#\w+/g; //all words starting with @
    var today = new Date().toISOString().slice(0, 10);
    // console.log(today);
    plogs.forEach(function (plog) {
        // d = new Date(plog._id);
        d = new Date(plog.moddate);
        dd = d.toLocaleString(_locale, {
            weekday: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        // console.log('dd: '+dd);
        dued = '';
        var sdue = plog.due; //string of due, e.g. 2018-04-24
        if (sdue) {
            var aa = '';
            var bb = '';
            if (plog.status === 'open') {
                bb = '</span>';
                if (sdue < today) {
                    aa = '<span class="fs-red w3-round">';
                } else if (sdue === today) {
                    aa = '<span class="fs-yellow w3-round">';
                } else {
                    aa = '<span class="fs-green w3-round">';
                }
            }
            due = new Date(sdue);
            due = due.toLocaleString(_locale, {
                weekday: 'short',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
            dued = '- Due: ' + aa + due + bb;
        }
        text = (plog.title + ' ' + plog.text).toLowerCase(); //search in title and text
        match1 = text.match(reg1); //array of found tags
        match2 = text.match(reg2);
        var personsarray = [];
        var tagsarray = [];
        personsarray = unique(personsarray.concat(match1));
        tagsarray = unique(tagsarray.concat(match2));
        var persons = (personsarray[0]) ? '- <person>' + personsarray.join('</person> <person>') +
            '</person>' : ""; //spaces between tags
        var tags = (tagsarray[0]) ? '- <tag>' + tagsarray.join('</tag> <tag>') + '</tag>' : "";
        list += "<tr class='row-" + plog.scope + "'>" +
            "<td class='td-left'>" + "<span style='display:none'>" + plog._id + "</span>" +
            "<span class='label-small'>" +
            dd + " " + persons + ' ' + tags + ' ' + dued + "</span><br>" +
            plog.title + "</td>" + "<td class='td-right'>" + "<span style='display:none';>" +
            plog._id + "</span>" + "<label>" + addSvg(plog.action, plog.status) + "</label></td>" +
            "</tr>";
        // console.log(list);
    });
    if (start === 0) {
        $('#activelist').html(list);
    } else {
        $('#activelist').append(list);
    }
    // marktext(".label-small"); //highlight tags and persons
    if (_active_id) {
        $('tr:has(td:contains("' + _active_id + '"))').addClass("fs-gray");
    } else {
        $("#activelist tr:first-child").addClass("fs-gray");
        _active_id = $("#activelist tr:first-child").text().substr(0, 24);;
    }
}

function redrawMenu(plogs) { //update menu after changes in plogs
    // alert('we start redrawPlogs');
    var match1, match2, text, t;
    var reg1 = /\B\#\w+/g; //all words starting with #
    var reg2 = /\B\@\w+/g; //all words starting with @
    _tagsarray = [];
    _personsarray = [];
    plogs.forEach(function (plog) {
        text = (plog.title + ' ' + plog.text).toLowerCase(); //search in title and text
        match1 = text.match(reg1); //array of found tags
        if (match1) { //there are tags, so update menu Tags (menubar)
            _tagsarray = unique(_tagsarray.concat(match1));
        }
        match2 = text.match(reg2);
        if (match2) { //there are people, so update menu People (menubar)
            _personsarray = unique(_personsarray.concat(match2));
        }
    });
    // Make new tag-menu
    t = '<a href="#" class="w3-bar-item w3-button gettagelement">' + _lg.getall + '</a>';
    for (i = 0; i < _tagsarray.length; i++) {
        t += '<a href="#" class="w3-bar-item w3-button gettagelement">' + _tagsarray[i] + '</a>'
    }
    $("#tagselectelements").html(t); //replace tags in menu
    $(".gettagelement").click(function () { //get click event; doc is here ready again
        _selecttag = $(this).text();
        $("#tagselectelements").removeClass('w3-show');
        if (_selecttag === _lg.getall) {
            $("#tagselect").text(_lg.tagselect).removeClass('bottombar').removeClass('tagsmenu');
            _selecttag = '';
        } else {
            $("#tagselect").text(_selecttag).addClass('bottombar').addClass('tagsmenu');
        }
        // console.log('_selecttag'+': '+_selecttag);
        Select();
    });
    //Make new person-menu
    t = '<a href="#" class="w3-bar-item w3-button getpersonelement">' + _lg.getall + '</a>';
    for (i = 0; i < _personsarray.length; i++) {
        t += '<a href="#" class="w3-bar-item w3-button getpersonelement">' + _personsarray[i] + '</a>'
    }
    $("#personselectelements").html(t); //replace persons in menu
    $(".getpersonelement").click(function () { //get click event; doc is here ready again
        _selectperson = $(this).text();
        $("#personselectelements").removeClass('w3-show');
        if (_selectperson === _lg.getall) {
            $("#personselect").text(_lg.personselect).removeClass('bottombar').removeClass('personsmenu');
            _selectperson = '';
        } else {
            $("#personselect").text(_selectperson).addClass('bottombar').addClass('personsmenu');
        }
        Select();
    });
}

function addSvg(action, status) { //show correct action icon in table
    var y = (status === 'done') ? '-ch' : '';
    var x = '<svg viewBox="0 0 500 500" class="select-icon-svg">';
    x += '<use xlink:href="#' + action + y + '-symbol" x="0" y="0" />';
    x += '</svg>';
    return x;
}

function setLanguage() {
    // var lg = localStorage.getItem("lgdevice");
    // _locale = (lg) ? lg : _locale;
    switch (_locale) {
        case 'nl-NL':
            // lgnr = 1; //us:0, nl:1
            _lg = translate.nl;
            break;
        case 'de-DE':
            // lgnr = 2; //us:0, nl:1
            _lg = translate.de;
            break;
        default:
            // lgnr = 0; //us:0, nl:1
            _lg = translate.us;
            break;
    }
    // overrule names that are defined by user (in settings)
    var scopenames = JSON.parse(localStorage.getItem("scopenames"));
    if (scopenames) {
        _lg.scopehome = (scopenames.home) ? scopenames.home : _lg.scopehome;
        _lg.scopework = (scopenames.work) ? scopenames.work : _lg.scopework;
        _lg.scopeother = (scopenames.other) ? scopenames.other : _lg.scopeother;
    }
}

function w3_open() { //sidebar open, overlay for dark background
    $("#mySidebar").show();
    $("#myOverlay").show();
}

function w3_close() {
    $("#mySidebar").hide();
    $("#myOverlay").hide();
}

// Hide Header on on scroll down
function hasScrolled() {
    var navbarHeight = $('header').outerHeight();
    var delta = 5;
    // var st = $(this).scrollTop();
    var st = $("#box0").scrollTop();
    start = (st === 0) ? 0 : start; //reset start if on top
    var sh = $('body').outerHeight(); //scroll height
    var p = st / sh;
    if (p > 0.8) { // almost at bottum: get new records
        start += 1;
        Select();
    }
    if (Math.abs(_lastScrollTop - st) <= delta)
        return;
    if (st > _lastScrollTop && st > navbarHeight) {
        $('header').removeClass('nav-down').addClass('nav-up');
        $('.scrollToTop').fadeIn();
        $('#addnewplog').fadeOut();
    } else {
        $('header').removeClass('nav-up').addClass('nav-down');
        $('.scrollToTop').fadeOut();
        $('#addnewplog').fadeIn();
    }
    _lastScrollTop = st;
    // console.log('_lastScrollTop: '+_lastScrollTop);
} // END: hide header when scrolling down


function showMessage(hd, msg) {
    $("#popupheader").html(hd);
    $("#popupmessage").html(msg);
    $("#popup01").show();
}

function showmessagebox(hd, msg, list) {
    $("#messageboxheader").html(hd);
    $("#messageboxmessage").html(msg);
    $("#messageboxlist").html(list);
    $("#messagebox").show();
}

function swipe() { //activates swiperight and swipeleft
    var maxTime = 1000, // allow movement if < 1000 ms (1 sec)
        maxDistance = 10, // swipe movement of 50 pixels triggers the swipe
        target = $('#verticalbar'), //thin vertical bar on left side of screen
        startX = 0,
        startTime = 0,
        touch = "ontouchend" in document,
        startEvent = (touch) ? 'touchstart' : 'mousedown',
        moveEvent = (touch) ? 'touchmove' : 'mousemove',
        endEvent = (touch) ? 'touchend' : 'mouseup';
    target.on(startEvent, function (e) {
        e.preventDefault(); // prevent image drag (Firefox)
        startTime = e.timeStamp;
        startX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;
    }).on(endEvent, function (e) {
        startTime = 0;
        startX = 0;
    }).on(moveEvent, function (e) {
        e.preventDefault();
        var currentX = e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX,
            currentDistance = (startX === 0) ? 0 : Math.abs(currentX - startX),
            currentTime = e.timeStamp;
        if (startTime !== 0 && currentTime - startTime < maxTime && currentDistance > maxDistance) {
            if (currentX < startX) { // swipe left code here
                w3_close();
            }
            if (currentX > startX) { // swipe right code here
                w3_open();
            }
            startTime = 0;
            startX = 0;
        }
    });
}

function random16() { //make base32 random word of 16 chars
    var key = {
        'i': 'w',
        'l': 'x',
        'o': 'y',
        'u': 'z'
    };
    var x = Math.floor(Math.random() * 1e13);
    var y = Math.floor(Math.random() * 1e13);
    x = x.toString(32).replace(/[ilou]/, function (a) {
        return key[a];
    });
    y = y.toString(32).replace(/[ilou]/, function (a) {
        return key[a];
    });
    return x.slice(0, 8) + y.slice(0, 8);
}

function exportcsv(which) {
    var plogs;
    plogs = plogsdb({
        status: which //which is array
    }).order('_id desc').get();
    var txt = '"date","time",title","text","scope","action","due",status"\n';
    var title, text, date, time = '';
    plogs.forEach(function (plog) {
        //double quotes replaced by single quotes
        //delete <mark...>..</mark> to keep file clean
        //no div's and br's, normal spaces
        date = plog._id.slice(0, 10);
        time = plog._id.slice(11, 16);
        title = plog.title.replace(/\"/g, "\'")
            // .replace(/<mark[^>]*>|<\/mark[^>]*>/g, "")
            .replace(/<div[^>]*>|<\/div[^>]*>|<br[^>]*>|&nbsp;/g, " ");
        text = plog.text.replace(/\"/g, "\'")
            // .replace(/<mark[^>]*>|<\/mark[^>]*>/g, "")
            .replace(/<div[^>]*>|<\/div[^>]*>|<br[^>]*>|&nbsp;/g, " ");
        txt += '"' + date + '","' + time + '","' + title + '","' + text +
            '","' + plog.scope + '","' + plog.action + '","' + plog.due + '","' + plog.status + '"\n'
    });
    var filename = 'plogsdownload.csv';
    var blob = new Blob([txt], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, filename);
}

function removeplogs(which) {
    var count = plogsdb({
        status: which
    }).get().length;
    alerty.confirm(
        'Are you sure you want to remove ' + count + ' plogs?', {
            title: 'Remove plogs (cannot be undone)',
            cancelLabel: 'Cancel',
            okLabel: 'OK'
        },
        function () {
            //   alerty.toasts('this is ok callback', {place: 'top'})
            var plogs = plogsdb({
                status: which
            }).remove();
            alertmessage(count + ' plogs removed');
            Select();
            saveplogstoLS();
        },
        function () {
            // alerty.toasts('this is cancel callback')
        }
    )
}

function alertmessage(text) {
    alerty.toasts(text, {
        place: 'bottom',
        bgColor: 'yellow',
        fontColor: 'black'
    });
}

$(document).ready(function () {
    // start if internet connection
    // initGapi(); // from google api-script
    // scroll ------------------------------
    var didScroll;
    var delta = 5;
    $("#box0").scroll(function (event) {
        didScroll = true;
    });
    setInterval(function () { //check scroll every 250ms
        if (didScroll) {
            hasScrolled();
            didScroll = false;
        }
    }, 250);
    $('.scrollToTop').click(function () {
        $('html, body, #box0').animate({
            scrollTop: 0
        }, 800);
        return false;
    });
    getdata();
    // watchfile();
    setscreen(_activemode);
    showHtml();
    $('link[title="plogscolor-1"]').prop('disabled', true);
    // $('link[title="plogscolor-1"]').prop('disabled', false);
    $('[data-toggle="datepicker"]').datepicker({ //puts selected date in form
        language: 'nl-NL',
        weekStart: 1,
        autoHide: true
    });
    $('.datepicker').on('pick.datepicker', function (e) { //gets selected date to put in _setdue
        var dd = ('0' + $('.datepicker').datepicker('getDate').getDate()).slice(-2); //get leading zeroes
        var mm = ('0' + ($('.datepicker').datepicker('getDate').getMonth() + 1)).slice(-2);
        var yyyy = $('.datepicker').datepicker('getDate').getFullYear();
        _setdue = yyyy + '-' + mm + '-' + dd;
        saveplog();
        showPlogs();
        _activemode = 'edit';
        // console.log('_setdue'+_setdue);
        setTimeout(function () { //fills due date field with local datestring + weekday
            var d = new Date(_setdue);
            d = d.toLocaleString(_locale, {
                weekday: 'short',
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });
            $("#idue").text(d);
        }, 10); //[data-toggle="datepicker"]'... is a bit slow
    });
    $("#clearsearch").hide();
    $("[name=setscope]").val([_defaultscope]); //show default
    $("#scopeplog").val([_defaultscope]); // set default 
    fillactionicon(_defaultaction, ''); //show default
    $("#actionplog").val(_defaultaction); //set default
    $('.editable').each(function () {
        this.contentEditable = true;
    });

    $("#verticalbar").hammer().on("swiperight", function (ev) {
        w3_open();
    });
    $("#mySidebar").hammer().on("swipeleft", function (ev) {
        w3_close();
    });
    $(".getdueelement").click(function (event) { // Input for query from menu bar. Similar event detections for tags and persons in prepareRS()
        var selectduetext = $(this).text();
        var dueselect = event.target.id; //id of selected element  
        var today = new Date().toISOString().slice(0, 10); //format yyyy-mm-dd
        $("#dueselectelements").removeClass('w3-show');
        if (dueselect === 'dueselectall') {
            $("#dueselect").text(_lg.dueselect).removeClass('bottombar').removeClass('duegreenmenu').removeClass('dueredmenu').removeClass('dueyellowmenu');
            _selectdue = {};
        } else if (dueselect === 'dueselectdue') {
            $("#dueselect").text(selectduetext).addClass('bottombar').addClass('duegreenmenu').removeClass('dueredmenu').removeClass('dueyellowmenu');
            _selectdue = {
                gt: '2000-01-01'
            }; //this excludes plogs without due date
        } else if (dueselect === 'dueselecttoday') {
            $("#dueselect").text(selectduetext).addClass('bottombar').addClass('dueyellowmenu').removeClass('dueredmenu').removeClass('duegreenmenu');
            _selectdue = {
                is: today
            };
        } else if (dueselect === 'dueselectoverdue') {
            $("#dueselect").text(selectduetext).addClass('bottombar').addClass('dueredmenu').removeClass('dueyellowmenu').removeClass('dueyellowmenu');
            _selectdue = {
                lt: today,
                gt: '2000-01-01'
            };
        }
        Select();
    });
    $(".getscopeelement").click(function (event) { // Input for query from menu bar. Similar event detections for tags and persons in prepareRS()
        var scopeselect = event.target.id; //id of selected element  
        // _selectscope = $(this).text();
        console.log(scopeselect);
        $("#scopeselectelements").removeClass('w3-show');
        if (scopeselect === 'scopeselectall') {
            $("#scopeselect").text('Scope').removeClass('bottombar').removeClass('scopehomemenu').removeClass('scopeworkmenu').removeClass('scopeothermenu');
            _selectscope = '';
        } else {
            $("#scopeselect").text(_selectscope).addClass('bottombar');
            if (scopeselect === 'scopeselecthome') {
                _selectscope = 'Home';
                $("#scopeselect").text(_lg.scopehome).addClass('scopehomemenu');
            } else if (scopeselect === 'scopeselectwork') {
                _selectscope = 'Work';
                $("#scopeselect").text(_lg.scopework).addClass('scopeworkmenu');
            } else if (scopeselect === 'scopeselectother') {
                _selectscope = 'Other';
                $("#scopeselect").text(_lg.scopeother).addClass('scopeothermenu');
            }
        }
        console.log('_selectscope' + ': ' + _selectscope);
        Select();
    });
    if (_platform === 'nwjs') { //on windows computers we van use hover
        $("#actionselect").hover(function () { //hover on action menu
            $("#actionselecticons").addClass('w3-show');
            $("#activelist").addClass('low-z-idx');
        }, function () {
            $("#actionselecticons").removeClass('w3-show');
            $("#activelist").removeClass('low-z-idx'); //workaround to make active list clickable
        });
        $("#actionselecticons").hover(function () { //hover on submenu action
            $("#actionselecticons").addClass('w3-show');
            $("#activelist").addClass('low-z-idx');
        }, function () {
            $("#actionselecticons").removeClass('w3-show');
            $("#activelist").removeClass('low-z-idx'); //workaround to make active list clickable
        });
        $("#scopeselect").hover(function () { //click on scope filter
            $("#scopeselectelements").addClass('w3-show');
        }, function () {
            $("#scopeselectelements").removeClass('w3-show');
        });
        $("#scopeselectelements").hover(function () { //click on scope filter
            $("#scopeselectelements").addClass('w3-show');
        }, function () {
            $("#scopeselectelements").removeClass('w3-show');
        });
        $("#tagselect").hover(function () { //click on tag filter
            $("#tagselectelements").addClass('w3-show');
        }, function () {
            $("#tagselectelements").removeClass('w3-show');
        });
        $("#tagselectelements").hover(function () { //click on tag filter
            $("#tagselectelements").addClass('w3-show');
        }, function () {
            $("#tagselectelements").removeClass('w3-show');
        });
        $("#personselect").hover(function () { //click on person filter
            $("#personselectelements").addClass('w3-show');
        }, function () {
            $("#personselectelements").removeClass('w3-show');
        });
        $("#personselectelements").hover(function () { //click on person filter
            $("#personselectelements").addClass('w3-show');
        }, function () {
            $("#personselectelements").removeClass('w3-show');
        });
        $("#dueselect").hover(function () { //click on due filter
            $("#dueselectelements").addClass('w3-show');
        }, function () {
            $("#dueselectelements").removeClass('w3-show');
        });
        $("#dueselectelements").hover(function () { //click on due filter
            $("#dueselectelements").addClass('w3-show');
        }, function () {
            $("#dueselectelements").removeClass('w3-show');
        });
    } else { // on touch screen devices we use click event
        $("#actionselect").on('click', function () { //click on action menu
            $("#scopeselectelements").removeClass('w3-show');
            $("#getall").removeClass('w3-show');
            $("#tagselectelements").removeClass('w3-show');
            $("#personselectelements").removeClass('w3-show');
            $("#dueselectelements").removeClass('w3-show');
            if ($("#actionselecticons").hasClass('w3-show')) { //toggle menu
                $("#activelist").removeClass('low-z-idx');
                $("#actionselecticons").removeClass('w3-show');
            } else {
                $("#activelist").addClass('low-z-idx');
                $("#actionselecticons").addClass('w3-show');
            }
        });
        $("#scopeselect").on('click', function () { //click on scope filter
            $("#getall").removeClass('w3-show');
            $("#tagselectelements").removeClass('w3-show');
            $("#personselectelements").removeClass('w3-show');
            $("#dueselectelements").removeClass('w3-show');
            $("#actionselecticons").removeClass('w3-show');
            if ($("#scopeselectelements").hasClass('w3-show')) { //toggle menu
                $("#scopeselectelements").removeClass('w3-show');
            } else {
                $("#scopeselectelements").addClass('w3-show');
            }
        });
        $("#tagselect").on('click', function () { //click on tag filter
            $("#getall").removeClass('w3-show');
            $("#scopeselectelements").removeClass('w3-show');
            $("#personselectelements").removeClass('w3-show');
            $("#dueselectelements").removeClass('w3-show');
            $("#actionselecticons").removeClass('w3-show');
            if ($("#tagselectelements").hasClass('w3-show')) { //toggle menu
                $("#tagselectelements").removeClass('w3-show');
            } else {
                $("#tagselectelements").addClass('w3-show');
            }
        });
        $("#personselect").on('click', function () { //click on person filter
            $("#getall").removeClass('w3-show');
            $("#scopeselectelements").removeClass('w3-show');
            $("#tagselectelements").removeClass('w3-show');
            $("#dueselectelements").removeClass('w3-show');
            $("#actionselecticons").removeClass('w3-show');
            if ($("#personselectelements").hasClass('w3-show')) { //toggle menu
                $("#personselectelements").removeClass('w3-show');
            } else {
                $("#personselectelements").addClass('w3-show');
            }
        });
        $("#dueselect").on('click', function () { //click on due filter
            $("#getall").removeClass('w3-show');
            $("#scopeselectelements").removeClass('w3-show');
            $("#tagselectelements").removeClass('w3-show');
            $("#personselectelements").removeClass('w3-show');
            $("#actionselecticons").removeClass('w3-show');
            if ($("#dueselectelements").hasClass('w3-show')) { //toggle menu
                $("#dueselectelements").removeClass('w3-show');
            } else {
                $("#dueselectelements").addClass('w3-show');
            }
        });
    }
    $("#dueclear").on('click', function () { //click on due set
        $('#idue').text('');
        _setdue = '';
        saveplog();
        showPlogs();
    });
    $("#centralpart").click(function () { //click anywhere
        $("#actionselecticons").removeClass('w3-show');
        $("#activelist").removeClass('low-z-idx');
    });
    $("#getall").click(function () { //select all plogs
        _selectscope = '';
        _selecttag = '';
        _selectperson = '';
        _selectaction = '';
        _selectdue = {};
        $("#myFilter").val('');
        $("#scopeselect").text('Scope').removeClass('bottombar').removeClass('scopehomemenu').removeClass('scopeworkmenu').removeClass('scopeothermenu');
        $("#tagselect").text(_lg.tagselect).removeClass('bottombar').removeClass('scopehomemenu');
        $("#personselect").text(_lg.personselect).removeClass('bottombar').removeClass('scopeothermenu');
        $("#dueselect").text(_lg.dueselect).removeClass('bottombar').removeClass('scopeothermenu');
        $("#actionselect").removeClass('bottombaraction');
        $("#scopeselectelements").removeClass('w3-show');
        $("#tagselectelements").removeClass('w3-show');
        $("#personselectelements").removeClass('w3-show');
        $("#getall").removeClass('w3-show');
        $("#dueselectelements").removeClass('w3-show');
        // console.log('getall: ');
        Select();
    });
    $("#getactionall").click(function () { //select all plogs
        $("#actionselecticons").removeClass('w3-show');
        $("#activelist").removeClass('low-z-idx');
        $("#actionselect").removeClass('bottombaraction');
        _selectaction = '';
        Select();
    });
    $("#getactionlog").click(function () { //select only log plogs
        $("#actionselecticons").removeClass('w3-show');
        $("#activelist").removeClass('low-z-idx');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'log';
        Select();
    });
    $("#getactiontodo").click(function () { //select only todo plogs
        $("#activelist").removeClass('low-z-idx');
        $("#actionselecticons").removeClass('w3-show');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'todo';
        Select();
    });
    $("#getactionremind").click(function () { //select only remind plogs
        $("#activelist").removeClass('low-z-idx');
        $("#actionselecticons").removeClass('w3-show');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'remind';
        Select();
    });
    $("#getactionidea").click(function () { //select only idea plogs
        $("#activelist").removeClass('low-z-idx');
        $("#actionselecticons").removeClass('w3-show');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'idea';
        Select();
    });
    $("#getactiontarget").click(function () { //select only target plogs
        $("#activelist").removeClass('low-z-idx');
        $("#actionselecticons").removeClass('w3-show');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'target';
        Select();
    });
    $("#getactionget").click(function () { //select only get plogs
        $("#activelist").removeClass('low-z-idx');
        $("#actionselecticons").removeClass('w3-show');
        $("#actionselect").addClass('bottombaraction');
        _selectaction = 'get';
        Select();
    });
    // set values in editform ---------------------------------------
    $("input[name='setscope']").click(function () { //set scope in editform
        _activemode = 'edit';
        _defaultscope = $("input[name='setscope']:checked").val();
        localStorage.setItem("defaultscope", _defaultscope);
        $("#scopeplog").val(_defaultscope);
        saveplog();
        showPlogs(); //CHECK: only redrawPlogs?
    });
    $("input[name='setaction']").click(function () { //if click on action in editform
        _activemode = 'edit';
        _defaultaction = $("input[name='setaction']:checked").val(); //get clicked action
        var status = 'open';
        if (_defaultaction === $("#actionplog").val()) { // compare with original action (in hidden field) no change in action, so toggle status..
            if ($("#statusplog").val() !== 'done') {
                status = 'done';
                $("#statusplog").val('done');
            } else {
                status = 'open';
                $("#statusplog").val('open');
            }
        } else {
            $("#actionplog").val(_defaultaction);
            $("#statusplog").val('open');
        }
        localStorage.setItem("defaultaction", _defaultaction);
        fillactionicon(_defaultaction, status);
        saveplog();
        showPlogs(); //CHECK: only redrawPlogs?
    });
    $('#itit').keypress(function (e) { //prevent crlf in title
        if (e.which === 13) {
            return false;
        }
    });
    $("#itit").keydown(function (event) { //on enter go to textarea
        if (event.which === 13) {
            event.preventDefault();
            $("#itext").focus();
        }
    });
    $("#myFilter").keyup(function (event) {
        Select();
    });
    $("#activelist").hammer({
        domEvents: true
    }).on('tap', 'tr td:first-child', function () { //select plog to view/edit
        if (_activemode === 'edit') {
            // marktext('.editable');
            saveplog();
        }
        _activemode = 'list';

        // console.log('clickactivelist1'+_active_id);
        _active_id = $(this).text().substr(0, 24);
        // console.log('clickactivelist2'+_active_id);
        $("#activelist tr").removeClass("fs-gray");
        $(this).closest("tr").addClass("fs-gray");
        editplog(_active_id);
    });
    //select plog and toggle action ----------------
    $("#activelist").hammer({
        domEvents: true
    }).on('tap', 'tr td:nth-child(2)', function () {
        if (_activemode === 'edit') {
            // marktext('.editable');
            saveplog();
        }
        _activemode = 'list';
        _active_id = $(this).prev().text().substr(0, 24);
        $("#activelist tr").removeClass("fs-gray");
        $(this).closest("tr").addClass("fs-gray");
        if (_screenmode !== 'small') editplog(_active_id); //small screen: don't go to edit screen
        var plog = plogsdb({
            _id: _active_id
        }).get()[0];
        var actionhtml;
        if (plog.status === 'open') {
            fillactionicon(plog.action, 'done'); //set icon in editform
            updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'done',
                plog.due, plog.moddate)
            actionhtml = "<span style='display:none';>" + plog._id + "</span>" + "<label>" +
                addSvg(plog.action, 'done') + "</label>";
            // .then(function (response) {
            setscreen(_activemode);
            //     alertmessage('plog updated');
            // }, function (error) {
            //     console.error("Update Failed!", error);
            // });
        } else if (plog.status === 'done') {
            fillactionicon(plog.action, 'open');
            updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'open',
                plog.due, plog.moddate)
            actionhtml = "<span style='display:none';>" + plog._id + "</span>" + "<label>" +
                addSvg(plog.action, 'open') + "</label>";
            // .then(function (response) {
            setscreen(_activemode);
            //     alertmessage('plog updated');
            // }, function (error) {
            //     console.error("Update Failed!", error);
            // });
        }
        $(this).closest("tr td:nth-child(2)").html(actionhtml); //no redrawPlogs here, only icon is toggled
    });
    $("#activelist").hammer({
        domEvents: true
    }).on("swipe", "tr td:first-child", function (event) {
        if (_activemode === 'edit') {
            // marktext('.editable');
            saveplog();
        }
        _activemode = 'list';
        _active_id = $(this).text().substr(0, 24);
        var plog = plogsdb({
            _id: _active_id
        }).get()[0];
        if (plog.status === 'trash') { //trash plogs are shown
            updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'open',
                plog.due, plog.moddate);
            // .then(function (response) {
            showTrash();
            alertmessage('plog undeleted');
            // }, function (error) {
            //     console.error("Update Failed!", error);
            // });
        } else { //normal plogs shown
            var nextid = $(this).closest('tr').next().text().substr(0, 24);
            updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'trash',
                plog.due, plog.moddate);
            // .then(function (response) {
            alertmessage('plog deleted (trash)');
            _active_id = (nextid) ? nextid : _active_id;
            Select();
            // editplog(_active_id);
            // }, function (error) {
            //     console.error("Update Failed!", error);
            // });
        }
        setscreen(_activemode);
    });
    $(document).keydown(function (event) {
        if (event.which === 32 && _activemode === 'list') { //spacebar
            event.preventDefault();
            _active_id = $("#activelist").find('.fs-gray').closest('tr').text().substr(0, 24);
            // console.log(_active_id);
            var plog = plogsdb({
                _id: _active_id
            }).get()[0];
            var actionhtml;
            if (plog.status === 'open') {
                fillactionicon(plog.action, 'done'); //set icon in editform
                updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'done',
                    plog.due, plog.moddate);
                actionhtml = "<span style='display:none';>" + plog._id + "</span>" + "<label>" +
                    addSvg(plog.action, 'done') + "</label>";
                setscreen(_activemode);
            } else if (plog.status === 'done') {
                fillactionicon(plog.action, 'open');
                updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'open',
                    plog.due, plog.moddate);
                actionhtml = "<span style='display:none';>" + plog._id + "</span>" + "<label>" +
                    addSvg(plog.action, 'open') + "</label>";
                setscreen(_activemode);
            }
            $('tr:has(td:contains("' + _active_id + '")) td:nth-child(2)').html(actionhtml);
            // Select();
        } else if (event.which === 36 && _activemode === 'list') { //home
            // console.log('home');
            var activerow = $("#activelist").find('.fs-gray').closest('tr');
            activerow.removeClass("fs-gray");
            activerow = $("#activelist tr:first-child");
            _active_id = activerow.text().substr(0, 24);
            if (_screenmode != 'small') editplog(_active_id);
            $('html, body, #box0').animate({ //scroll table so active row remains visible
                scrollTop: 0
            }, 300);
            activerow.addClass("fs-gray");
        } else if (event.which === 35 && _activemode === 'list') { //end
            // console.log('end');
            var activerow = $("#activelist").find('.fs-gray').closest('tr');
            activerow.removeClass("fs-gray");
            activerow = $("#activelist tr:last-child");
            var activelist = $("#activelist");
            _active_id = activerow.text().substr(0, 24);
            if (_screenmode != 'small') editplog(_active_id);
            $('html, body, #box0').animate({ //scroll table so active row remains visible
                scrollTop: activerow.offset().top - activelist.offset().top + activelist.scrollTop() - 70
            }, 500);
            activerow.addClass("fs-gray");
        } else if (event.which === 33 && _activemode === 'list') { //page up
            var id = $("#activelist").find('.fs-gray').closest('tr').prev().text().substr(0, 24);
            if (id) { //if first row is selected nothing happens
                var activerow = $("#activelist").find('.fs-gray').closest('tr');
                activerow.removeClass("fs-gray");
                var row;
                for (let i = 0; i < 8; i++) {
                    row = activerow.prev();
                    if (row.text()) activerow = row;
                }
                activerow.addClass("fs-gray");
                _active_id = activerow.text().substr(0, 24);
                if (_screenmode != 'small') editplog(_active_id);
                var activelist = $("#activelist");
                $('html, body, #box0').animate({ //scroll table so active row remains visible
                    scrollTop: activerow.offset().top - activelist.offset().top - $("body").height() + 180
                }, 30);
            }
        } else if (event.which === 34 && _activemode === 'list') { //page down
            var id = $("#activelist").find('.fs-gray').closest('tr').next().text().substr(0, 24);
            if (id) { //if last row is selected nothing happens
                var activerow = $("#activelist").find('.fs-gray').closest('tr');
                activerow.removeClass("fs-gray");
                var row;
                for (let i = 0; i < 8; i++) {
                    row = activerow.next();
                    if (row.text()) activerow = row;
                }
                activerow.addClass("fs-gray");
                _active_id = activerow.text().substr(0, 24);
                if (_screenmode != 'small') editplog(_active_id);
                var activelist = $("#activelist");
                $('html, body, #box0').animate({ //scroll table so active row remains visible
                    scrollTop: activerow.offset().top - activelist.offset().top - $("body").height() + 180
                }, 30);
            }
        } else if (event.which === 38 && _activemode === 'list') { //arrow up
            var id = $("#activelist").find('.fs-gray').closest('tr').prev().text().substr(0, 24);
            if (id) { //if first row is selected nothing happens
                var activerow = $("#activelist").find('.fs-gray').closest('tr');
                activerow.removeClass("fs-gray");
                activerow = activerow.prev();
                activerow.addClass("fs-gray");
                _active_id = id;
                if (_screenmode != 'small') editplog(id);
                var activelist = $("#activelist");
                $('html, body, #box0').animate({ //scroll table so active row remains visible
                    scrollTop: activerow.offset().top - activelist.offset().top - $("body").height() + 180
                }, 30);
            }
        } else if (event.which === 40 && _activemode === 'list') { //arrow down
            var id = $("#activelist").find('.fs-gray').closest('tr').next().text().substr(0, 24);
            if (id) { //if last row is selected nothing happens
                var activerow = $("#activelist").find('.fs-gray').closest('tr');
                activerow.removeClass("fs-gray");
                activerow = activerow.next();
                activerow.addClass("fs-gray");
                _active_id = id;
                if (_screenmode != 'small') editplog(id);
                var activelist = $("#activelist");
                $('html, body, #box0').animate({
                    scrollTop: activerow.offset().top - activelist.offset().top - $("body").height() + 180
                }, 30);
            }
        } else if (event.which === 37 && _activemode === 'edit' && event.altKey) { //Alt - arrow left
            $("#idue").focus(); //not so elegant, but to prevent focus on itit or itext
            $(".back").trigger('click');
        } else if (event.which === 13 && _activemode === 'list') { // enter
            // console.log(_active_id);
            event.preventDefault();
            editplog(_active_id);
            $("#itit").focus();
        } else if (event.which === 8 && _activemode === 'edit' && _screenmode === 'small' &&
            !($('#itext').is(":focus") || $('#itit').is(":focus"))) { // backspace
            // backspace: back to list if in small screenmode and no focus on textareas
            event.preventDefault();
            saveplog();
            showPlogs(); //CHECK: only redrawPlogs?
            _activemode = 'list';
            setscreen(_activemode);
            Select();
        } else if (event.which === 116) { // F5 - reload app
            location.reload();
        } else if (event.which === 27) { // escape: clear searchbox
            $("#myFilter").val('');
            $("#getall").focus();
            Select();
        } else if (event.which === 191 && _activemode === 'list') { // slash forward /
            event.preventDefault();
            $("#myFilter").focus(); //search
            $('html, body, #box0').animate({
                scrollTop: 0
            }, 800);
        }
        // _active_id = $("#activelist").find('.fs-gray').closest('tr').text().substr(0, 24);
        // console.log('_active_id' + ': ' + _active_id);
    });
    $("#itit").on("focus", function () {
        var plogs = JSON.parse(localStorage.getItem('data'));
        objIndex = plogs.findIndex((obj => obj._id == _active_id)); // finds index of existing record
        if (objIndex > -1) $("#itit").html(plogs[objIndex].title);
        _activemode = 'edit';
    });
    $("#itit").on("focusout", function () {
        saveplog(); //updateplog checks if plog is really changed
        var tit = $("#itit").html(); // html to visualize tags and persons
        tit = mark(tit); //show <tag>s <person>s
        $("#itit").html(tit);
        Select();
    });
    $("#itext").on("focus", function () {
        var plog = plogsdb({
            _id: _active_id
        }).get()[0];
        console.log('text '+plog.text);
        $("#itext").html(plog.text);
        _activemode = 'edit';
    });
    $("#itext").on("focusout", function () {
        saveplog(); //updateplog checks if plog is really changed
        var txt = $("#itext").html(); // html to visualize tags and persons
        var txt = mark(txt); //show <tag>s <person>s
        $("#itext").html(txt);
        Select();
    });

    $("#addnewplog").on('click', function () {
        _activemode = 'edit';
        makenewplog();
    });
    $("#addnewplog-but").on('click', function () {
        _activemode = 'edit';
        makenewplog();
    });
    $('.back').on('click', function () { //save or update new or edited plog
        // saveplog();
        showPlogs(); //CHECK: only redrawPlogs?
        _activemode = 'list';
        setscreen(_activemode);
        Select();
    });
    $('#cancelplog').on('click', function () { //save or update new or edited plog
        _activemode = 'list';
        setscreen(_activemode);
        showPlogs();
        Select();
    });
    $('#trashicon').click(function () {
        console.log('_active_id' + ': ' + _active_id);
        if (_active_id) { //only if plog is selected
            var plogsLS = JSON.parse(localStorage.getItem('data'));
            objIndex = plogsLS.findIndex((obj => obj._id == _active_id)); 
            var plog;
            if (objIndex > -1) {
                plog = plogsLS[objIndex];
                if (plog.status === 'trash') { //trash plogs are shown
                    console.log('plog.status' + ': ' + plog.status);
                    $("#trashicon").css('background-image', 'url("../res/img/trashicon.png")');
                    updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'open',
                        plog.due, plog.moddate)
                    // .then(function (response) {
                    alertmessage('plog undeleted');
                    // _active_id = (nextid) ? nextid : _active_id; 
                    Select(); //in both cases return to normal plogs
                    editplog(_active_id);
                    _activemode = 'list';
                    setscreen(_activemode);
                    // }, function (error) {
                    //     console.error("Update Failed!", error);
                    // });
                } else { //normal plogs shown
                    var nextid = $("#activelist").find('.fs-gray').closest('tr').next().text().substr(0, 24);
                    updatePlog(_active_id, plog.title, plog.text, plog.scope, plog.action, 'trash',
                        plog.due, plog.moddate)
                    // .then(function (response) {
                    alertmessage('plog deleted');
                    _active_id = (nextid) ? nextid : _active_id;
                    Select(); //in both cases return to normal plogs
                    editplog(_active_id);
                    _activemode = 'list';
                    setscreen(_activemode);
                    // }, function (error) {
                    //     console.error("Update Failed!", error);
                    // });
                }
            }
        }
    });
    $('#duplicate').on('click', function () { //save and make new plog
        _activemode = 'edit';
        if (_active_id) { //only if plog is selected
            // saveplog();
            duplicate();
        }
    });
    $("#closemessagebox, #btn-messageboxright").on('click', function () {
        $("#messagebox").hide();
    });
    $("#btn-messageboxleft").on('click', function () { //OK from messagebox
        var boxtype = $("#messageboxlist").text().substr(0, 9);
        // console.log(boxtype);
        var checks = [];
        if (boxtype === 'downloadb') { //boxtype is set by $("#godownloadbox").on('click', function () etc
            if ($('#check1').is(':checked')) checks.push('open');
            if ($('#check2').is(':checked')) checks.push('done');
            if ($('#check3').is(':checked')) checks.push('trash');
            // console.log(checks);
            exportcsv(checks);
            $("#messagebox").hide();
        } else if (boxtype === 'removebox') {
            if ($('#check1').is(':checked')) checks.push('open');
            if ($('#check2').is(':checked')) checks.push('done');
            if ($('#check3').is(':checked')) checks.push('trash');
            // console.log(checks);
            removeplogs(checks);
            $("#messagebox").hide();
        } else if (boxtype === 'loginbox_') {
            signIn();
            $("#messagebox").hide();
        } else if (boxtype === 'settings_') { //get user input for new scopenames
            var scopenames = {
                home: '',
                work: '',
                other: ''
            };
            if ($('#scopehomename').val()) scopenames.home = $('#scopehomename').val();
            if ($('#scopeworkname').val()) scopenames.work = $('#scopeworkname').val();
            if ($('#scopeothername').val()) scopenames.other = $('#scopeothername').val();
            localStorage.setItem('scopenames', JSON.stringify(scopenames));
            $("#messagebox").hide();
            location.reload(); //reload takes values form localstorage
        } else if (boxtype === 'setpathbo') {
            $('#selectpath').unbind('change');
            // $('#selectpath').click();
            $("#selectpath").change(function () {
                _path = $("#selectpath").val();
                _path = (_path.slice(-1) != '\\') ? _path + '\\' : _path;
                alertmessage('New path: ' + _path);
                localStorage.setItem("path", _path);
                $("#selectedpath").text(_path);
            });
            $("#selectpath").trigger('click');
            // return false;
        }
    });
    $("#closeapp").on('click', function () {
        detectLanguage(); //next time the right language setting will apply (if setting has changed)
        if (navigator.app) { //closing is necessary if user wants to apply new language settings (if changed)
            navigator.app.exitApp();
        } else if (navigator.device) {
            navigator.device.exitApp();
        } else {
            console.log('app would now close');
        }
    });
    $(".goabout").on('click', function () {
        w3_close();
        var d = new Date();
        var yyyy = d.getFullYear();
        $("#favicon").removeClass("favicon2");
        var hd = _lg.About2;
        var msg = "<p>" + _lg.msg01 + "</p>";
        msg += "<p><a href='https://plogs.scriptel.nl' target='_blank'>plogs.scriptel.nl</a></p>";
        msg += "<p>" + version + "</p><p>Copyright &copy; " + yyyy + ", Scriptel</p><hr/>";
        msg += "<p class='italic'>" + _lg.msg04 + "</p>";
        msg += "<p class='italic'>" + _lg.msg05 + "</p>";
        $("#logo").show();
        showMessage(hd, msg);
    });
    $("#gosettingsbox").on('click', function () {
        w3_close();
        $("#favicon").removeClass("favicon2");
        var hd = _lg.hdSettings;
        var msg = "<p><b>" + _lg.hdScope + "</b><p>" + _lg.msgSettingsScope + "</p>";
        var boxtype = 'settings_';
        $("#btn-messageboxleft").html(_lg.OK);
        $("#btn-messageboxright").html(_lg.Cancel);
        var home = _lg.scopehome; //defined in function setLanguage
        var work = _lg.scopework;
        var other = _lg.scopeother;
        var list = '<span style="display:none">' + boxtype + '</span>' +
            '<p><label class="label-small">First scope</label>' +
            '<input id="scopehomename" class="w3-input" type="text" value="' + home + '"></p>' +
            '<p><label class="label-small">Second scope</label>' +
            '<input id="scopeworkname" class="w3-input" type="text" value="' + work + '"></p>' +
            '<p><label class="label-small">Third scope</label>' +
            '<input id="scopeothername" class="w3-input" type="text" value="' + other + '"></p>';
        $("#logo").show();
        showmessagebox(hd, msg, list);
    });
    $("#gosetpathbox").on('click', function () {
        w3_close();
        $("#favicon").removeClass("favicon2");
        var hd = _lg.hdSetpath;
        var msg = "<p>" + _lg.msgSetpath + "</p>";
        var boxtype = 'setpathbox';
        $("#btn-messageboxleft").html(_lg.Change);
        $("#btn-messageboxright").html(_lg.Exit);
        var list = '<span style="display:none">' + boxtype + '</span>' +
            '<span id="selectedpath">' + _path + '</span>';
        $("#logo").show();
        showmessagebox(hd, msg, list);
    });
    $("#godownloadbox").on('click', function () {
        w3_close();
        $("#favicon").removeClass("favicon2");
        var hd = _lg.hdDownload;
        var msg = "<p>" + _lg.msgDownload + "</p>";
        var boxtype = 'downloadbox';
        $("#btn-messageboxleft").html(_lg.OK);
        $("#btn-messageboxright").html(_lg.Cancel);
        var list = '<span style="display:none">' + boxtype + '</span>' +
            '<p><input id="check1" class="w3-check" type="checkbox" checked="checked">' +
            '<label class="lbcheck">' + _lg.openplogs + '</label></p>' +
            '<p><input id="check2" class="w3-check" type="checkbox" checked="checked">' +
            '<label class="lbcheck">' + _lg.doneplogs + '</label></p>' +
            '<p><input id="check3" class="w3-check" type="checkbox">' +
            '<label class="lbcheck">' + _lg.trashplogs + '</label></p>';
        $("#logo").show();
        showmessagebox(hd, msg, list);
    });
    $("#gosync").on('click', function () {
        syncWithGD();
        w3_close();
    });
    $("#goremovebox").on('click', function () {
        w3_close();
        $("#favicon").removeClass("favicon2");
        var hd = _lg.hdRemove;
        var msg = "<p>" + _lg.msgRemove + "</p>";
        var boxtype = 'removebox';
        $("#btn-messageboxleft").html(_lg.OK);
        $("#btn-messageboxright").html(_lg.Cancel);
        var list = '<span style="display:none">' + boxtype + '</span>' +
            '<p><input id="check1" class="w3-check" type="checkbox">' +
            '<label class="lbcheck">' + _lg.openplogs + '</label></p>' +
            '<p><input id="check2" class="w3-check" type="checkbox">' +
            '<label class="lbcheck">' + _lg.doneplogs + '</label></p>' +
            '<p><input id="check3" class="w3-check" type="checkbox" checked="checked">' +
            '<label class="lbcheck">' + _lg.trashplogs + '</label></p>';
        $("#logo").show();
        showmessagebox(hd, msg, list);
    });
    $("#gologinbox").on('click', function () {
        w3_close();
        $("#favicon").removeClass("favicon2");
        var hd = 'Login to Google Drive';
        var msg = "<p>" + 'Login to Google to get access to Google Drive' + "</p>";
        var boxtype = 'loginbox_';
        $("#btn-messageboxleft").html(_lg.OK);
        $("#btn-messageboxright").html(_lg.Cancel);
        var list = '<span style="display:none">' + boxtype + '</span>';
        // var list = '<span style="display:none">' + boxtype + '</span>' +
        //     '<p><input id="check1" class="w3-check" type="checkbox">' +
        //     '<label class="lbcheck">' + _lg.openplogs + '</label></p>' +
        //     '<p><input id="check2" class="w3-check" type="checkbox">' +
        //     '<label class="lbcheck">' + _lg.doneplogs + '</label></p>' +
        //     '<p><input id="check3" class="w3-check" type="checkbox" checked="checked">' +
        //     '<label class="lbcheck">' + _lg.trashplogs + '</label></p>';
        $("#logo").show();
        showmessagebox(hd, msg, list);
    });
    $("#logo").on('click', function () {
        window.location.href = 'https://radios2s.scriptel.nl';
    });
    $("#selectpath").click(function () {
        w3_close();
    });
    $("#showtrash").click(function () {
        showTrash();
        w3_close();
    });
    $("#emptytrash").click(function () {
        emptytrash();
        w3_close();
    });
    $("#reloadapp").click(function () {
        location.reload();
    });
    // $("#searchbox").on("focus", function(){
    $("#myFilter").on("focus", function () {
        $(".title").hide();
        $("#clearsearch").show();
        $('#myFilter').attr("placeholder", "Zoek plogs");
    });
    $("#myFilter").on("focusout", function () {
        $('#myFilter').attr("placeholder", "");
        setTimeout(function () {
            $(".title").show();
        }, 400);
        $("#clearsearch").hide();
    });
    $("#clearsearch").hammer().on("tap", function (ev) {
        $("#myFilter").val('');
        Select();
    });
});

function detectLanguage() {
    if (navigator.globalization !== null && navigator.globalization !== undefined) { //Phonegap browser detection
        navigator.globalization.getPreferredLanguage(
            function (language) {
                if (_locale != language.value) {
                    _locale = language.value;
                    // alert('new language: '+_locale);
                }
                // alert('language.value' + ': ' + language.value);
            },
            function (error) {
                // alert('error');
            }
        );
    } else { //Normal browser detection
        console.log('window.navigator.language: ' + window.navigator.language);
        if (window.navigator.language !== null && window.navigator.language !== undefined) {
            if (_locale != window.navigator.language) {
                _locale = window.navigator.language;
            }
        }
    }
    localStorage.setItem("lgdevice", _locale);
}

function showHtml() {
    $("#makenewplog").html(_lg.Makenewplog);
    $("#goeditplogs").html(_lg.editplog);
    $("#closeapp").html(_lg.closeapp);
    $("#goabout").html(_lg.About1);
    $("#lb-homeurl").html(_lg.homeurl);
    // $("#lb-tags").html(_lg.Tags);
    $("#lb-language").html(_lg.Language);
    $("#titleeditform").html(_lg.editplog);
    $("#titleplog").html(_lg.titleplog);
    $("#textplog").html(_lg.textplog);
    $("#dueplog").html(_lg.dueplog);
    $("#actionplog").html(_lg.actionplog);
    $("#favicon").html(_lg.Favicon);
    $("#contnewplog").html(_lg.New);
    $("#deleteplog").html(_lg.Delete);
    $("#saveplog").text(_lg.Save);
    $("#cancelplog").html(_lg.Cancel);
    $("#editplogs").html(_lg.editplogs);
    $("#myFilter").attr("placeholder", _lg.Searchfor);
    // $("#getall", "#getactionall", "#scopeselectall", "#dueselectall", "#tagselectall", "#personselectall").html(_lg.getall);
    $("#getall, #getactionall, #scopeselectall, #dueselectall").html(_lg.getall);
    $("#getall").css("font-weight", "Bold");;
    $("#scopeselecthome").html(_lg.scopehome);
    $("#scopeselectwork").html(_lg.scopework);
    $("#scopeselectother").html(_lg.scopeother);
    $(".scopehomemenu").html(_lg.scopehome);
    $(".scopeworkmenu").html(_lg.scopework);
    $(".scopeothermenu").html(_lg.scopeother);
    $("#personselect").html(_lg.personselect);
    $("#dueselect").html(_lg.dueselect);
    $("#tagselect").html(_lg.tagselect);
    $("#dueselectdue").html(_lg.dueselectdue);
    $("#dueselecttoday").html(_lg.dueselecttoday);
    $("#dueselectoverdue").html(_lg.dueselectoverdue);
    $("#reloadapp").html(_lg.reloadapp);
    $("#gosettingsbox").html(_lg.gosettingsbox);
    $("#gosetpathbox").html(_lg.gosetpathbox);
    $("#goremovebox").html(_lg.goremovebox);
}