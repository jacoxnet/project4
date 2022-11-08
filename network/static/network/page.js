document.addEventListener('DOMContentLoaded', function() {

  // By default, load all posts
  load_posts('all_posts');
});

//
// compose - set up post input field
//      sent button calls sendpost
//      if argument, it's the old post to edit
//
async function compose_post(oldpostid=null) {
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
async function load_posts(list_of_posts) {

    // get DOM places to display this content
    const folder_title = document.querySelector('#folder_title');
    const folder_content = document.querySelector('#folder_content');
    
    // Set folder title and clear content
    folder_title.innerHTML = list_of_posts;
    folder_content.innerHTML = '';

    // get and display email results
    response = await fetch('/posts/' + list_of_posts);
    if (response.status >= 200 && response.status <= 299) {
        let posts = await response.json();
        if (posts.length > 0) {
            posts.forEach(post => {
                let card = document.createElement('div');
                card.setAttribute('class', 'card');
                let card_header = document.createElement('div');
                card_header.setAttribute('class', 'card-body');
                let card_body = document.createElement('div');
                card_body.setAttribute('class', 'card-body');
                let card_title = document.createElement('div');
                card_title.setAttribute('class', 'card-title');
                let card_text = document.createElement('div');
                card_text.setAttribute('class', 'card-text');
                let card_footer = document.createElement('div');
                card_footer.setAttribute('class', 'card-footer');
                // extract display elements for each email
                card_header.textContent = '@' + post.sender;
                card_text.textContent = post.body;
                card_footer.textContent = post.timestamp + ' ' + post.likecount + ' Likes';
                card.appendChild(card_header);
                card.appendChild(card_body);
                card.appendChild(card_footer);
                folder_content.appendChild(card)
            });
        } else {
            // if no posts were retrieved but not an error
            folder_content.innerHTML = '<i>No posts to display</i>';
        }
    }
    else {
        // error on retrieval
        folder_content.innerHTML = '<i>' + 'Error - ' + response.statusText + '</i>';
    }
}

//
// send email
//
async function send_email() {
    /* retrieve info from DOM fields */
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value; 
    /* send to server */
    let response = await fetch('/emails', {
        method: 'POST',
        body: JSON.stringify({
            recipients: recipients,
            subject: subject,
            body: body
        })
    });
    let data = await response.json();
    // if message sent successfully, display resulting status msg   
    if (response.status >= 200 && response.status <=299) {    
        document.querySelector("#sent").click();  
    } else {
        document.querySelector('#mymessages').textContent = data.error;
    }
}

//
// markread - helper function to mark an email read.
//      called from gotoemail
//
async function markread(emailid) {
    let response = await fetch('/emails/' + emailid, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
    });
    if (response.status >= 200 && response.status <=299) {
        return true;
    } else {
        return false;
    }
}

//
// changearchive - helper function to archive and unarchive
//      called from gotoemail
//
async function changearchive(emailid, archivestatus) {
    let response = await fetch('/emails/' + emailid, {
        method: 'PUT',
        body: JSON.stringify({
            archived: archivestatus
        })
    });
    document.querySelector("#inbox").click();    
}
    
//
// gotoemail - display the full content of an email
//      called when click on email in mailbox list
//      has reply button and (if not sent mailbox) archive
//      button
//  
//      arguments: mailbox name, email id number
//      (we need mailbox name because behavior differs
//      for archive button)
//
async function gotoemail(mailbox, emailid) {
    // hide others and activate this view 
    document.querySelector('#oneemail-view').style.display = 'block';
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'none';
    const archivebutton = document.querySelector('#archive');
    const replybutton = document.querySelector('#reply');
    // set up reply button functionality
    replybutton.setAttribute('onclick', `compose_email(${emailid})`);
    // show archive button if in inbox folder and set click function
    if (mailbox == 'inbox') {
        archivebutton.innerHTML = 'Archive';
        archivebutton.removeAttribute('hidden');
        archivebutton.setAttribute('onclick', `changearchive(${emailid}, true)`);
    }
    // hide archive button if in "sent" folder
    if (mailbox == 'sent') {
        archivebutton.setAttribute('hidden', true);
        console.log('hiding archive button');
    }
    // change archive to unarchive if in archive folder
    if (mailbox == 'archive') {
        archivebutton.innerHTML = 'Unarchive';
        archivebutton.removeAttribute('hidden');
        archivebutton.setAttribute('onclick', `changearchive(${emailid}, false)`);
    }
    // locate email folder_content in DOM
    const oneemail_header = document.querySelector('#oneemail_header');
    const oneemail_body = document.querySelector('#oneemail_body');
    // clear out
    oneemail_header.innerHTML = '';
    oneemail_body.innerHTML = '';
    // fetch email from id
    let response = await fetch('/emails/' + emailid);
    let data = await response.json();
    if (response.status >= 200 && response.status <=299) {
        // folder content has email to display
        oneemail_header.innerHTML ='<p><b>From:</b> ' + data.sender + '<br><b>To:</b> ' + data.recipients +
                                '<br><b>Subject: </b>' + data.subject + '<br><b>Timestamp: </b>' + data.timestamp;
        oneemail_body.innerHTML = data.body;
        // mark item read - indicate error if necessary
        markread(emailid);
    } else {
        oneemail_body.innerHTML = data.error;
    }
}