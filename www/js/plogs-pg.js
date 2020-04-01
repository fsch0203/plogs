// _platform = 'pg'; // can also be 'nwjs'
// var _windowwidth = Number(localStorage.getItem("windowwidth"));
// _windowwidth = (_windowwidth) ? _windowwidth : 480;
// console.log('_windowwidth: ' + _windowwidth);
// switchwindowsize();
// $(document).ready(function () {
//     var mw = screen.width;
//     if (_windowwidth >= 1000 && mw >= 1000){
//         // console.log('setbiggerscreen()');
//         setbiggerscreen();
//     } else if (_windowwidth > 700 && mw >= 1000){
//         // console.log('setbigscreen()');
//         setbigscreen();
//     } else {
//         // console.log('setsmallscreen()');
//         setsmallscreen();
//     }
// });

// function getdata() { //get json-file with plogs
//     // console.log('getdata');
//     var data = [{"_id":"2018-05-12T14:03:12.155Z","title":"Wielblok voor bus","text":"","scope":"work","due":"2018-05-13","moddate":"2018-05-12T14:03:12.155Z","action":"get","status":"trash"},{"_id":"2018-04-13T18:56:32.286Z","title":"bbb kbkbkb","text":"fsdfsdfxvxvc gfgbfgbjh","scope":"work","due":"2018-04-27","moddate":"2018-04-13T18:56:32.286Z","action":"target","status":"trash"},{"_id":"2018-04-13T14:44:12.947Z","title":" ui rirehg iwerh giwerh","text":"dfglkjfghkldfj jhbhjbjbj @jan&nbsp;snbv","scope":"home","due":"2018-04-25","moddate":"2018-04-13T14:44:12.947Z","action":"idea","status":"trash"},{"_id":"2018-04-13T14:43:42.445Z","title":"testtt","text":"dfgdfgdfgdf dfg @lia&nbsp;#tag&nbsp;","scope":"work","due":"2018-04-25","moddate":"2018-04-13T14:43:42.445Z","action":"target","status":"trash"},{"_id":"2018-04-13T12:33:31.147Z","title":"Bus inruimen","text":"Van alles in de bus zetten","scope":"home","due":"2018-04-27","moddate":"2018-04-13T12:33:31.147Z","action":"todo","status":"trash"},{"_id":"2018-05-12T15:10:46.967Z","title":"Op zangkoor gaan?","text":"Kan ik hier een vraagteken zetten.<br>Ja...<br>","scope":"home","due":"2018-05-13","moddate":"2018-05-12T20:52:21.289Z","action":"target","status":"open"},{"_id":"2018-05-12T14:15:18.139Z","title":"#Bus weer in order maken","text":"Wielblok<br>Gevarendriehoek<br>Nieuw plafondlampje&nbsp;<br>","scope":"home","due":"2018-05-24","moddate":"2018-05-13T07:10:48.711Z","action":"get","status":"open"},{"_id":"2018-05-12T14:02:38.825Z","title":"Wielblok voor bus","text":"nnj","scope":"home","due":"2018-05-24","moddate":"2018-05-12T20:10:56.861Z","action":"get","status":"open"},{"_id":"2018-04-16T19:18:22.702Z","title":"Gevalletje @piet","text":"bb, voor het #geval dat!","scope":"work","due":"2018-05-13","moddate":"2018-05-13T17:19:30.979Z","action":"remind","status":"open"},{"_id":"2018-04-16T18:06:16.579Z","title":"tttgggg @piet","text":"fdgnkknkj<br>* fdfbdfbfdn<br>* sdsdvdsdsfsdfsd sdfdsfsdf #golf<br>* fdvdfvdfsdds golf <br>csdcsdc","scope":"other","due":"2018-05-13","moddate":"2018-04-16T18:06:16.579Z","action":"todo","status":"open"},{"_id":"2018-04-16T14:59:57.388Z","title":"nieuw3 #voor","text":"zvdfvfdv dfv df v<br>fnfgngfn<br>* gh gh fghm * fddfbdfd<br>gfhgfhf&nbsp;<br><br>","scope":"home","due":"","moddate":"2018-05-13T13:02:16.263Z","action":"idea","status":"open"},{"_id":"2018-04-13T18:56:03.886Z","title":"fgfgdggdn #golf","text":"knnnkn<br>* hjgjgj<br>dfgdfgd gjgbjjb dsfdff&nbsp;@piet","scope":"home","due":"2018-05-30","moddate":"2018-04-13T18:56:03.886Z","action":"idea","status":"open"},{"_id":"2018-04-13T17:18:37.353Z","title":"vhvhvhvh h","text":"ghjgjg fhgfjjb jgjg&nbsp;@lia","scope":"other","due":"2018-05-12","moddate":"2018-05-13T12:59:13.370Z","action":"todo","status":"open"},{"_id":"2018-04-13T14:35:52.349Z","title":"test2666","text":"dfgdfgdf&nbsp;fhfghfg","scope":"other","due":"2018-05-10","moddate":"2018-04-13T14:35:52.349Z","action":"todo","status":"open"},{"_id":"2018-04-11T17:50:16.176Z","title":"Handicap 25","text":"Handicap 25 halen dit jaar #golf. Zou het lukken.","scope":"work","due":"2018-05-13","moddate":"2018-04-11T17:50:16.176Z","action":"target","status":"open"},{"_id":"2018-04-16T18:49:39.581Z","title":"Aan piet hh","text":"fddfgdfgb @jan&nbsp; #hjgjhg <br>jhhjgj #gghfh","scope":"other","due":"2018-05-07","moddate":"2018-04-16T18:49:39.581Z","action":"todo","status":"done"},{"_id":"2018-04-13T14:27:07.877Z","title":"Test1","text":"sdfdsfdsf vbnvbnb","scope":"home","due":"2018-05-12","moddate":"2018-04-13T18:57:03.886Z","action":"remind","status":"done"},{"_id":"2018-04-11T15:29:37.160Z","title":"Geweldig idee","text":"Wouw..","scope":"other","due":"2018-04-25","moddate":"2018-05-12T20:24:10.806Z","action":"target","status":"done"},{"_id":"2018-04-11T15:28:48.288Z","title":"Nog iets doen","text":"In #huis&nbsp;weer wat doen voor @piet&nbsp;","scope":"work","due":"","moddate":"2018-04-11T15:28:48.288Z","action":"log","status":"done"},{"_id":"2018-04-11T15:28:03.694Z","title":"Notitie","text":"Vandaag een nieuwe notitie","scope":"home","due":"2018-04-27","moddate":"2018-04-13T18:47:03.886Z","action":"log","status":"done"}];
//     var json = JSON.parse(localStorage.getItem("data"));
//     json = (json) ? json : data;
//     plogsdb.insert(json);
//     showPlogs();
// }

// function watchfile(){ //check if json-file is changed by other source
// }

// var options = {
//     files: [
//         // You can specify up to 100 files.
//         {'url': 'localhost:8000/splash.png', 'filename': 'splash.png'}
//     ],

//     // Success is called once all files have been successfully added to the user's
//     // Dropbox, although they may not have synced to the user's devices yet.
//     success: function () {
//         // Indicate to the user that the files have been saved.
//         alert("Success! Files saved to your Dropbox.");
//     },

//     // Progress is called periodically to update the application on the progress
//     // of the user's downloads. The value passed to this callback is a float
//     // between 0 and 1. The progress callback is guaranteed to be called at least
//     // once with the value 1.
//     progress: function (progress) {},

//     // Cancel is called if the user presses the Cancel button or closes the Saver.
//     cancel: function () {},

//     // Error is called in the event of an unexpected response from the server
//     // hosting the files, such as not being able to find a file. This callback is
//     // also called if there is an error on Dropbox or if the user is over quota.
//     error: function (errorMessage) {}
// };

// function saveplogstofile() {
//     var plogs = plogsdb().order("status desc, _id desc").get();
//     // console.log(plogs);
//     localStorage.setItem('data', JSON.stringify(plogs));
//     Dropbox.save(options);
// }

// function switchwindowsize(){ //toggle windowsize
//     // console.log('switchwindowsize');
//     localStorage.setItem("_active_id", _active_id);
//     var mw = screen.width;
//     if (win.width < 700 && mw >= 1200){
//         setbiggerscreen();
//         win.width = 1200;
//     } else if (win.width < 700 && mw >= 1000){
//         win.width = 1000;
//         setbigscreen();
//     } else {
//         win.width = 480;
//         setsmallscreen();
//     }
//     win.on('resize', function(w,h){
//         _active_id = localStorage.getItem("_active_id");
//         // console.log(_active_id);
//         // console.log(w);
//         if (_active_id){
//             $('tr:has(td:contains("'+ _active_id + '"))').addClass("fs-gray");
//         } else {
//             $("#activelist tr:first-child").addClass("fs-gray");
//             _active_id = $("#activelist tr:first-child").text().substr(0, 24);;
//         }
//     });
// }

