//
// edittweet - set up to edit an existing tweet
//
function edittweet(cardnum) {
    console.log(`editing at card ${cardnum}`);
    // find DOM location of card body and input elements
    const cardbody = document.querySelector(`#cardbody${cardnum}`);
    const bodyinput = document.querySelector(`#bodyinput${cardnum}`);
    // copy text from cardbody to bodyinput
    bodyinput.querySelector('textarea').textContent = cardbody.querySelector('.card-text').textContent.trim();
    // hide cardbody and display bodyinput
    cardbody.setAttribute('style', 'display:none');
    bodyinput.setAttribute('style', 'display:block');    
    return false;        
}


//
// confirmedit - replace body of old tweet 
//
async function confirmedit(evnt, cardnum, tweetid) {
    evnt.preventDefault();
    console.log(`confirm edit of card ${cardnum}`);
    const cardbody = document.querySelector(`#cardbody${cardnum}`);
    const bodyinput = document.querySelector(`#bodyinput${cardnum}`);
    const newbody = document.querySelector(`#confirmedit${cardnum}`).value;
    console.log(`new body is ${JSON.stringify(newbody)}`);
    /* send to server */
    let response = await fetch('/changetweet', {
        method: 'POST',
        body: JSON.stringify({
            id: tweetid,
            body: newbody
        })
    });
    if (response.status >= 200 && response.status <= 299) {
        let newpost = await response.json();
        console.log(`new post is now ${newpost.body}`);
        // place new text in cardbody
        cardbody.querySelector('div').textContent = newbody;
        // show cardbody and hide bodyinput
        bodyinput.setAttribute('style', 'display:none');    
        cardbody.setAttribute('style', 'display:block');
        return false;
    } else {
        // error on retrieval
        tweets_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

//
// cancel button functionality for editing tweet
//
function canceledit(evnt, cardnum) {
    evnt.preventDefault();
    const cardbody = document.querySelector(`#cardbody${cardnum}`);
    const bodyinput = document.querySelector(`#bodyinput${cardnum}`);
    // hide bodyinput and restore cardbody
    bodyinput.setAttribute('style', 'display:none');    
    cardbody.setAttribute('style', 'display:block');
}

//
// togglelike - called if like button clicked
//
async function togglelike(evnt, cardnum, tweetid) {
    evnt.preventDefault();
    response = await fetch('/togglelike', {
        method: 'POST',
        body: JSON.stringify({
            id: tweetid
        })
    });
    if (response.status >= 200 && response.status <=299) {
        data = await response.json();
        if (data.redheart) {
            document.querySelector('#heart' + cardnum.toString()).setAttribute('name', 'red');
        } else {
            document.querySelector('#heart' + cardnum.toString()).setAttribute('name', 'black');
        }
        document.querySelector('#heart' + cardnum.toString()).textContent = '\xa0' + data.likecount
    }
}


//
// display profile of named user
// 
function displayprofile(username) {
    console.log('looking for profile for ' + username);
    window.location.href = '/profile/' + username;
}

//
// toggle follow
//
async function togglefollow(username) {
    console.log('toggling follow for ' + username);
    await fetch('/togglefollow', {
        method: 'POST',
        body: JSON.stringify({
            username: username
        })
    });
    displayprofile(username);
}


//
// post tweet
//
async function posttweet(evnt) {
    evnt.preventDefault();
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