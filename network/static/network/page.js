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

    // get and display email results
    response = await fetch('/listtweets/' + tweetlist);
    if (response.status >= 200 && response.status <= 299) {
        let posts = await response.json();
        if (posts.length > 0) {
            posts.forEach(post => {
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
                // extract display elements for each tweet
                card_header.textContent = '@' + post.sender;
                card_text.textContent = post.body;
                card_footer.innerHTML = '<table class="table table-sm table-borderless"><tr><td>' +
                                        post.likecount + ' Likes' + '</td><td id="rj">' + 
                                        post.timestamp + '</td></tr></table>'
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