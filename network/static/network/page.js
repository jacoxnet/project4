document.addEventListener('DOMContentLoaded', function() {

  
  
    // Attach handler to post-tweet button
    document.querySelector('#post_tweet').addEventListener('click', () => posttweet());
    // By default, load all posts
    loadtweets('alltweets');
});

//
// compose - set up post input field
//      sent button calls sendpost
//      if argument, it's the old post to edit
//
async function composetweet(oldpostid=null) {
    if (oldpostid) {
        document.querySelector('#mymessages').textContent = 'Editing';
        let response = await fetch('/posts/' + oldpostid);
        let data = await response.json();
        document.querySelector('#compose-body').value = data.body;
    } else {
        document.querySelector('#mymessages').textContent = 'Composing'
        document.querySelector('#compose-body').value = '';
    }
}

function addstoplural(number, word) {
    if (number == 1) {
        return word;
    }
    else {
        return `${word}s`;
    }
}

async function displayprofile(username) {
    console.log('looking for profile for ' + username);
    const profile_title = document.querySelector('#profile_title');
    const profile_content = document.querySelector('#profile_content');
    let response = await fetch('displayprofile/' + username)
    if (response.status >= 200 && response.status <= 299) {
        let profile = await response.json();
        profile_title.textContent = '@' + username;
        const description = profile.description;
        const followcount = profile.follows.length;
        const followcountu = followcount.toString() + ' ' + addstoplural(followcount, 'user');
        const isfollowedbycount = profile.isfollowedby.length;
        const isfollowedbycountu = isfollowedbycount.toString() + ' ' + addstoplural(isfollowedbycount, 'user');
        profile_content.innerHTML =  '<div>' + description + '</div><div>Following ' + followcountu +
                                     '; followed by ' + isfollowedbycountu + '</div>'
        loadtweets('mytweets');
    }
    else {
        // error on retrieval
       profile_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

// 
// load and list of posts
//
async function loadtweets(tweetlist) {

    // get DOM places to display this content
    const tweets_title = document.querySelector('#tweets_title');
    const tweets_content = document.querySelector('#tweets_content');
    
    // Set folder title and clear content
    tweets_title.innerHTML = tweetlist;
    tweets_content.innerHTML = '';

    // get and display list results
    response = await fetch('/listtweets/' + tweetlist);
    if (response.status >= 200 && response.status <= 299) {
        let posts = await response.json();
        if (posts.length > 0) {
            posts.forEach(post => {
                // create all the elements of the card to display a tweet
                const card = document.createElement('div');
                card.setAttribute('class', 'card');
                const card_header = document.createElement('div');
                card_header.setAttribute('class', 'card-header');
                const card_body = document.createElement('div');
                card_body.setAttribute('class', 'card-body');
                const card_title = document.createElement('div');
                card_title.setAttribute('class', 'card-title');
                const card_text = document.createElement('div');
                card_text.setAttribute('class', 'card-text');
                const card_footer = document.createElement('div');
                card_footer.setAttribute('class', 'card-footer');
                // extract display elements for each tweet and place on card
                card_header.textContent = '@' + post.sender;
                card_text.textContent = post.body;
                card_footer.innerHTML = '<table class="table table-sm table-borderless"><tr><td>' +
                                        post.likecount + ' Likes' + '</td><td id="rj">' + 
                                        post.timestamp + '</td></tr></table>'
                // attach eventlistener to card header with sender
                card_header.addEventListener('click', () => displayprofile(post.sender));
                // append the card elements and then append to tweets_content
                card_body.appendChild(card_text);
                card.appendChild(card_header);
                card.appendChild(card_body);
                card.appendChild(card_footer);
                tweets_content.appendChild(card)
                
            });
        } else {
            // if no posts were retrieved but not an error
            tweets_content.innerHTML = '<i>No posts to display</i>';
        }
    }
    else {
        // error on retrieval
       tweets_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

//
// send email
//
async function posttweet() {
    /* retrieve info from DOM fields */
    const compose_body = document.querySelector('#compose-body');
    let body = compose_body.value;
    /* send to server */
    let response = await fetch('/addtweet', {
        method: 'POST',
        body: JSON.stringify({
            body: body
        })
    });
    let data = await response.json();
    // if message sent successfully, display resulting status msg   
    if (response.status >= 200 && response.status <=299) {    
        // set post input box to empty
        compose_body.setAttribute('value', '')
        // send a click to go to allposts
        document.querySelector('#allposts').click();
    } else {
        document.querySelector('#mymessages').textContent = data.error;
    }
}