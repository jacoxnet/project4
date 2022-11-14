document.addEventListener('DOMContentLoaded', function() {

    // Attach handler to card headers to call profile page
    // card headers have the usernames (minus @ at start)
    document.querySelectorAll('.card-header').forEach((element) => {
        const username = element.textContent.trim().slice(1);
        element.addEventListener('click', () => displayprofile(username));
    })
    
    
    // addEventListener('click', () => posttweet());
    // // Attach handler to following link
    // document.querySelector('#followinglink').addEventListener('click', () => loadtweets('myfollows'));
    // // Attach handler to username link
    // document.querySelector('#usernamelink').addEventListener('click', () => displayprofile('current_user'));
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
    cancelbutton.addEventListener('click', () => redrawpost(oldpost, cardnum));
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

//
// cancel button functionality for editing tweet
//
function redrawpost(oldpost, cardnum) {
    const oldcard = document.querySelector(`#card${cardnum}`);
    const newcard = makecard(oldpost, cardnum);
    // replace with original card
    oldcard.innerHTML = newcard.innerHTML;
    // replace event listeners which isn't copied with HTML
    oldcard.querySelector('a').addEventListener('click', () => edittweet(oldpost, cardnum));
    oldcard.querySelector('i').addEventListener('click', () => addlike(oldpost, cardnum));
}

//
// called if like button clicked
//
async function addlike(post, cardnum) {
    await fetch('/addlike', {
        method: 'POST',
        body: JSON.stringify({
            id: post.id
        })
    });
    const oldcard = document.querySelector(`#card${cardnum}`)
    oldcard.querySelector('i').classList.add('red');
}

//
// helper fuction adds s to plural noun
//
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