document.addEventListener('DOMContentLoaded', function() {
    // By default, load all posts
    loadtweets('alltweets');
    // Attach handler to post-tweet button
    document.querySelector('#post_tweet').addEventListener('click', () => posttweet());
    // Attach handler to following link
    document.querySelector('#followinglink').addEventListener('click', () => loadtweets('myfollows'));
    // Attach handler to username link
    document.querySelector('#usernamelink').addEventListener('click', () => displayprofile('current_user'));
});

//
// edittweet - set up to edit an existing tweet
//
function edittweet(oldpost, cardnum) {
    const oldcard = document.querySelector(`#card${cardnum}`);
    // create textarea to replace card
    const newform = document.createElement('form');
    const newtextarea = document.createElement('textarea');
    newtextarea.setAttribute('class', 'form-control');
    newtextarea.setAttribute('id', 'confirmedit');
    newtextarea.textContent = oldpost.body;
    const newbutton = document.createElement('button');
    newbutton.setAttribute('type', 'button');
    newbutton.setAttribute('class', 'btn btn-primary');
    newbutton.textContent = 'Confirm edit';
    newbutton.addEventListener('click', () => confirmedit(oldpost, cardnum));
    const cancelbutton = document.createElement('button');
    cancelbutton.setAttribute('type', 'button');
    cancelbutton.setAttribute('class', 'btn btn-secondary');
    cancelbutton.textContent = 'Cancel';
    cancelbutton.addEventListener('click', () => canceledit(oldpost, cardnum));
    // clear out old card body
    oldcard.querySelector('.card-body').innerHTML = '';
    // build up editing box and add to this card
    newform.appendChild(newtextarea);
    newform.appendChild(newbutton);
    newform.appendChild(cancelbutton);
    oldcard.querySelector('.card-body').appendChild(newform);
}

//
// confirmedit - replace body of old tweet 
//
async function confirmedit(oldpost, cardnum) {
    console.log(`confirm edit of card ${cardnum}`);
    const oldcard = document.querySelector(`#card${cardnum}`);
    const newbody = document.querySelector('#confirmedit').value;
    console.log(`new body is ${JSON.stringify(newbody)}`);
    /* send to server */
    let response = await fetch('/changetweet', {
        method: 'POST',
        body: JSON.stringify({
            id: oldpost.id,
            body: newbody
        })
    });
    if (response.status >= 200 && response.status <= 299) {
        let newpost = await response.json();
        console.log(`new post is now ${newpost.body}`);
        oldcard.innerHTML = '';
        const newcard = makecard(newpost, cardnum);
        // replace with new card
        oldcard.innerHTML = newcard.innerHTML;
        // replace event listener which isn't copied with HTML
        oldcard.querySelector('a').addEventListener('click', () => edittweet(newpost, cardnum));
    } else {
        // error on retrieval
        tweets_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

function canceledit(oldpost, cardnum) {
    const oldcard = document.querySelector(`#card${cardnum}`);
    const newcard = makecard(oldpost, cardnum);
    // replace with original card
    oldcard.innerHTML = newcard.innerHTML;
    // replace event listener which isn't copied with HTML
    oldcard.querySelector('a').addEventListener('click', () => edittweet(oldpost, cardnum));
}

function addstoplural(number, word) {
    if (number == 1) {
        return word;
    }
    else {
        return `${word}s`;
    }
}

//
// display profile of named user
// 
async function displayprofile(username) {
    console.log('looking for profile for ' + username);
    const profile_title = document.querySelector('#profile_title');
    const profile_content = document.querySelector('#profile_content');
    let response = await fetch('displayprofile/' + username)
    if (response.status >= 200 && response.status <= 299) {
        let profile = await response.json();
        profile_title.textContent = '@' + profile.user;
        const description = profile.description;
        const followcount = profile.follows.length;
        const followcountu = followcount.toString() + ' ' + addstoplural(followcount, 'user');
        const isfollowedbycount = profile.isfollowedby.length;
        const isfollowedbycountu = isfollowedbycount.toString() + ' ' + addstoplural(isfollowedbycount, 'user');
        profile_content.innerHTML =  '<div>' + description + '</div><div>Following ' + followcountu +
                                     '; followed by ' + isfollowedbycountu + '</div>'
        loadtweets(profile.user);
    }
    else {
        // error on retrieval
       profile_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
    return false;
}

//
// helper function
//      make a card from a post
//      cardnum is a counter for card on page
//
function makecard(post, cardnum) {
    // create the HTML elements of the card 
    const card = document.createElement('div');
    card.setAttribute('class', 'card');
    card.setAttribute('id', 'card' + cardnum.toString())
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
    // create footer table data
    const foot_table = document.createElement('table');
    const foot_tbody = document.createElement('tbody');
    const foot_row = document.createElement('tr');
    const foot_data1 = document.createElement('td');
    const foot_data2 = document.createElement('td');
    // assign data to elements
    card_header.textContent = '@' + post.sender;
    card_text.textContent = post.body;
    foot_data1.textContent = post.likecount + ' Likes';
    foot_data2.textContent = post.timestamp
    // set attributes of card elements
    foot_table.setAttribute('class', 'table table-sm table-borderless');
    card_header.addEventListener('click', () => displayprofile(post.sender));
    foot_data2.setAttribute('id', 'rj');
    // add edit button if appropriate
    if (post.sender == document.querySelector('#toplevel').getAttribute('data-username')) {
        const newbutton = document.createElement('a');
        const buttontext = document.createElement('div');
        newbutton.setAttribute('href', 'javascript:void(0)')
        newbutton.addEventListener('click', () => edittweet(post, cardnum));
        buttontext.textContent = 'Edit your post';
        newbutton.appendChild(buttontext);
        card_text.appendChild(newbutton);
    }
    // append the card elements and then return card
    foot_row.appendChild(foot_data1);
    foot_row.appendChild(foot_data2);
    foot_tbody.appendChild(foot_row);
    foot_table.appendChild(foot_tbody);
    card_footer.appendChild(foot_table);
    card_body.appendChild(card_text);
    card.appendChild(card_header);
    card.appendChild(card_body);
    card.appendChild(card_footer);
    return card;
}
// 
// load list of posts
//
async function loadtweets(tweetlist) {
    console.log(`trying to display tweetlist ${tweetlist}`);
    // get DOM places to display this content
    const tweets_title = document.querySelector('#tweets_title');
    const tweets_content = document.querySelector('#tweets_content');
    // Set folder title and clear content
    if (tweetlist == 'alltweets') {
        tweets_title.innerHTML = 'All posts';    
    } else if (tweetlist == 'myfollows') {
        tweets_title.innerHTML = "My followers' posts";    
    } else {
        // tweetlist is user's username
        tweets_title.innerHTML = `@${tweetlist}'s posts`
    }
    tweets_content.innerHTML = '';
    // get and display list results
    response = await fetch('/listtweets/' + tweetlist);
    if (response.status >= 200 && response.status <= 299) {
        let posts = await response.json();
        if (posts.length > 0) {
            for (let i = 0; i < posts.length; i++) {
                tweets_content.appendChild(makecard(posts[i], i));
            }
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
// post tweet
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