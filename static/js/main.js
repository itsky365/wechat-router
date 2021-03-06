
// Author: Sergio Castaño Arteaga
// Email: sergio.castano.arteaga@gmail.com

(function(){

    var debug = false;

    // ***************************************************************************
    // Socket.io events
    // ***************************************************************************
    
    var conn = null;
    conn = new WebSocket('ws://' + window.location.host + '/chatsocket');
    conn.onopen = function() {
        var info = {'room':'MainRoom', 'username':'ServerBot', 'msg':'----- connect established -----'};
        addMessage(info);
//        conn.send(JSON.stringify({"event":"helloworld"}));
        console.log("----connectian established----");
    };
    conn.onmessage = function(e) {
//        console.log(e);
        var info = $.parseJSON(e.data); 
        console.log(info);
        if (info.event == "newMessage"){
            addMessage(info);
//            console.log(info);
            var room_messages = '#'+info.room+' #room_messages';
            console.log($(room_messages).scrollHeight);
            console.log($(room_messages).height());
            $(room_messages).animate({
                scrollTop: $(room_messages).height()*10
            }, 300);
        } 
        else if (info.event == "queryUnhandled"){
//            console.log(info);
            for(var i = 0, l = info.users.length; i < l; i++) {
                addUnhandledList(info.users[i]);
            }
        }

        else if (info.event == "getUnhandledUser"){
            //          console.log(info);
            if (!roomExists(info.room)) {
                addRoomTab(info.room);
                addRoom(info.room,updateMessage,info);
            }
            updateMessage(info);
            
        }
    };

    var updateMessage = function(info){
        for(var i = 0, l = info.message.length; i < l; i++) {
            var mymsg = info.message[i];
            mymsg.room=info.room;
            console.log(mymsg);
            addMessage(mymsg);
        }
    }

    conn.onclose = function() {
        var info = {'room':'MainRoom', 'username':'ServerBot', 'msg':'----- Lost connection to server -----'};
        addMessage(info);
        conn = null;
    };

    // ***************************************************************************
    // Templates and helpers
    // ***************************************************************************
    
    var templates = {};
    var getTemplate = function(path, callback) {
        var source;
        var template;
 
        // Check first if we've the template cached
        if (_.has(templates, path)) {
            if (callback) callback(templates[path]);
        // If not we get and compile it
        } else {
            $.ajax({
                url: path,
                success: function(data) {
                    source = data;
                    template = Handlebars.compile(source);
                    // Store compiled template in cache
                    templates[path] = template;
                    if (callback) callback(template);
                }
            });
        }
    }

    // Add room tab
    var addRoomTab = function(room) {
        getTemplate('static/js/templates/room_tab.handlebars', function(template) {
            $('#rooms_tabs').append(template({'room':room}));
            $("ul li button").click(function(eventObject){
                eventObject.preventDefault();
//                console.log($(this).prev().text());
                var currentRoom = $(this).prev().text();
                if (currentRoom != 'MainRoom') {
                    if (roomExists(currentRoom)) {
                        removeRoomTab(currentRoom);
                        removeRoom(currentRoom);
                        $('[href="#MainRoom"]').click();
                    }
                } else{
                    console.log('Cannot leave MainRoom, sorry');
                }
          

                
            });
        });
    };

    // Remove room tab
    var removeRoomTab = function(room) {
        var tab_id = "#"+room+"_tab";
        $(tab_id).remove();
    };

    // Add room
    var addRoom = function(room,callback,info) {
        getTemplate('static/js/templates/room.handlebars', function(template) {
            $('#rooms').append(template({'room':room}));
            // Toogle to created room
            var newroomtab = '[href="#'+room+'"]';
            $(newroomtab).click();
            callback(info);
        });
    };
    
    // Remove room
    var removeRoom = function(room) {
        var room_id = "#"+room;
        $(room_id).remove();
    };

    // Add message to room
    var addMessage = function(msg) {
        getTemplate('static/js/templates/message.handlebars', function(template) {
            var room_messages = '#'+msg.room+' #room_messages';
            if(msg.type=="text"){
                $(room_messages).append(template(msg));
            }
            else if(msg.type=="img"){
                var newMsg = {
                    "msg":'<img src="' + msg.msg + '" />',
                    "username":msg.username,
                };
                $(room_messages).append(template(newMsg));
            }
        });
    };

    // Add message to unhandled user list
    var addUnhandledList = function(msg) {
        getTemplate('static/js/templates/users.handlebars', function(template) {
            $("#modal_joinroom ul").append(template(msg));
        });
    };
    
    // Add user to connected users list
    var addUser = function(user) {
        getTemplate('static/js/templates/user.handlebars', function(template) {
            var room_users = '#'+user.room+' #room_users';
            // Add only if it doesn't exist in the room
            var user_badge = '#'+user.room+' #'+user.id;
            if (!($(user_badge).length)) {
                $(room_users).append(template(user));
            }
        });
    }

    // Remove user from connected users list
    var removeUser = function(user) {
        var user_badge = '#'+user.room+' #'+user.id;
        $(user_badge).remove();
    };

    // Check if room exists
    var roomExists = function(room) {
        var room_selector = '#'+room;
        if ($(room_selector).length) {
            return true;
        } else {
            return false;
        }
    };

    // Get current room
    var getCurrentRoom = function() {
        return $('li[id$="_tab"][class="active"]').children("a:first").children("span:first").text();
    };
    

    // Get message text from input field
    var getMessageText = function() {
        var text = $('#message_text').val();
        $('#message_text').val("");
        return text;
    };

    // Get room name from input field
    var getRoomName = function() {
        var name = $('#room_name').val();
        $('#room_name').val("");
//        console.log(name);
        return name;
    };

    // Get nickname from input field
    var getNickname = function() {
        var nickname = $('#nickname').val();
        $('#nickname').val("");
        return nickname;
    };

    // Update nickname in badges
    var updateNickname = function(data) {
        var badges = '#'+data.room+' #'+data.id;
        $(badges).text(data.newUsername);
    };

    // ***************************************************************************
    // Events
    // ***************************************************************************

    // Send new message
    $('#b_send_message').click(function(eventObject) {
        eventObject.preventDefault();
        if ($('#message_text').val() != "") {
//            console.log({'event':'newMessage','room':getCurrentRoom(), 'msg':getMessageText()});
            conn.send(JSON.stringify({'event':'newMessage','room':getCurrentRoom(), 'msg':getMessageText()}));
        }
    });

    $("#modal_joinroom").on("hidden", function() {
//        console.log("clear content " + $(this).children("div.modal-body").children("ul").text());
        $(this).children("div.modal-body").children("ul").empty();
    });  
    // query all unhandled users
    $("#modal_joinroom").on("show", function() {  
//        console.log('query unhandled message');
        conn.send(JSON.stringify({'event':'queryUnhandled'}));
    });  
    // check unhandled request
    $('#b_join_room').click(function(eventObject){
        eventObject.preventDefault();
        var rooms = $("#modal_joinroom ul li").each(function(){
            if($(this).find("input")[0].checked){
//                console.log('query unhandled message');
                conn.send(JSON.stringify({'event':'getUnhandledUser','username':$(this).children("span:first").text()}));
            }
        });
        $('#modal_joinroom').modal('hide');
    });

    // Leave current room
    $('#b_leave_room').click(function(eventObject) {
        eventObject.preventDefault();
        var currentRoom = getCurrentRoom();
        if (currentRoom != 'MainRoom') {
//            socket.emit('unsubscribe', {'rooms':[getCurrentRoom()]}); 
            // Toogle to MainRoom
            $('[href="#MainRoom"]').click();
        } else {
            console.log('Cannot leave MainRoom, sorry');
        }
    });

    // Set nickname
    $('#b_set_nickname').click(function(eventObject) {
        eventObject.preventDefault();
        socket.emit('setNickname', {'username':getNickname()});

        // Close modal if opened
        $('#modal_setnick').modal('hide');
    });

})();

