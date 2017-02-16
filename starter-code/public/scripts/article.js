'use strict';

function Article(opts) {
  // REVIEW: Convert property assignment to a new pattern. Now, ALL properties of `opts` will be
  // assigned as properies of the newly created article object. We'll talk more about forEach() soon!
  // We need to do this so that our Article objects, created from DB records, will have all of the DB columns as properties (i.e. article_id, author_id...)
  Object.keys(opts).forEach(function (e) {
    this[e] = opts[e]
  }, this);
}

Article.all = [];

// ++++++++++++++++++++++++++++++++++++++

// REVIEW: We will be writing documentation today for the methods in this file that handles Model layer of our application. As an example, here is documentation for Article.prototype.toHtml(). You will provide documentation for the other methods in this file in the same structure as the following example. In addition, where there are TODO comment lines inside of the method, describe what the following code is doing (down to the next TODO) and change the TODO into a DONE when finished.

/**
 * OVERVIEW of Article.prototype.toHtml():
 * - A method on each instance that converts raw article data into HTML
 * - Inputs: nothing passed in; called on an instance of Article (this)
 * - Outputs: HTML of a rendered article template
 */
Article.prototype.toHtml = function () {
  // DONE: Retrieves the  article template from the DOM and passes the template as an argument to the Handlebars compile() method, with the resulting function being stored into a variable called 'template'.
  var template = Handlebars.compile($('#article-template').text());

  // DONE: Creates a property called 'daysAgo' on an Article instance and assigns to it the number value of the days between today and the date of article publication
  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn)) / 60 / 60 / 24 / 1000);

  // DONE: Creates a property called 'publishStatus' that will hold one of two possible values: if the article has been published (as indicated by the check box in the form in new.html), it will be the number of days since publication as calculated in the prior line; if the article has not been published and is still a draft, it will set the value of 'publishStatus' to the string '(draft)'
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';

  // DONE: Assigns into this.body the output of calling marked() on this.body, which converts any Markdown formatted text into HTML, and allows existing HTML to pass through unchanged
  this.body = marked(this.body);

  // DONE: Output of this method: the instance of Article is passed through the template() function to convert the raw data, whether from a data file or from the input form, into the article template HTML
  return template(this);
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.loadAll
 * - This method receives the data from the DB and prepares it for use in the HTML
 * - Inputs: An array containing data from the SQL server
 * - Outputs: for every element in the array create an article object, sort by publication date, and store the object in the Article.all property
 */
Article.loadAll = function (rows) {
  // DONE: if the result of b - a is less than 0, then a gets moved below b and comes first. if it is greater than zero, b comes first
  rows.sort(function (a, b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // DONE: for every piece of data at each element in the array, it will instantiate an object from that data and push it to Article.all
  rows.forEach(function (ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.fetchAll():
 * - This method checks to see if there are records in the database and then loads or creates the records depending on the result.
 * - Inputs: a callback function of articleView.initIndexPage, which is coming from articleView.js and is invoked on index.html
 * - Outputs: No outputs
 */
Article.fetchAll = function (callback) {
  // DONE: This code is calling an AJAX selector for the /articles location
  $.get('/articles')
    // DONE: Once the /articles selector has been called, then it begins a function with an if/else statement taking the results as its argument
    .then(
    function (results) {
      if (results.length) { // If records exist in the DB
        // DONE: if records exist in the DB, feed them into the Article.loadAll method and then invokes articleView.initIndexPage method through the callback alias
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // DONE: pull the records from the static file hackerIpsum.json, then push those records into the DB
        $.getJSON('./data/hackerIpsum.json')
          .then(function (rawData) {
            rawData.forEach(function (item) {
              let article = new Article(item);
              article.insertRecord(); // Add each record to the DB
            })
          })
          // DONE: following creating the data in the DB, circle back around and call the fetchAll method with the intent of triggering the 'if' result
          .then(function () {
            Article.fetchAll(callback);
          })
          // DONE: if the output is something other than what is covered in the if/else, throw an error and log it to the console
          .catch(function (err) {
            console.error(err);
          });
      }
    }
    )
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.truncateTable
 * - Takes an argument of callback and delete a selection from the table
 * - Inputs: /articles URL and the callback parameter
 * - Outputs: table minus the truncated data
 */
Article.truncateTable = function (callback) {
  // DONE: call an AJAX selector for /articles and sends a DELETE command to the server
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
    // DONE: console log the data which has been removed from the server and then call the callback function
    .then(function (data) {
      console.log(data);
      if (callback) callback();
    });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.insertRecord
 * - It adds new data to the SQL DB table
 * - Inputs: an Article object instance
 * - Outputs: logs insertion to table as successful
 */
Article.prototype.insertRecord = function (callback) {
  // DONE: sends an instance of an Article object to the /articles location on the DB
  $.post('/articles', { author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title })
    // DONE: log the Article data and check for a callback function then invoke it if it exists
    .then(function (data) {
      console.log(data);
      if (callback) callback();
    })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.deleteRecord
 * - This method on the Article proto makes an AJAX HTTP request on an article of a particular ID and deletes it. After the AJAX call completes, the data that was deleted is logged, and if a callback function has been passed as an argument, it will run.
 * - Inputs: the instance of Article this is being called on
 * - Outputs: console log of the data
 */
Article.prototype.deleteRecord = function (callback) {
  // DONE: makes an AJAX request on an article with a particular ID and deletes it from the table
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
    // DONE: logs data and checks if a callback function has been passed and runs it if that is true
    .then(function (data) {
      console.log(data);
      if (callback) callback();
    });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.updateRecord
 * - Describe what the method does: This method attaches a prototype of updateRecord to Article.  It uses AJAX to get a particular article id and puts the data listed into the table it then checks if a callback function has been passed and runs it if it exists.
 * - Inputs: article id and the data from the Article function
 * - Outputs: the data added to the table
 */
Article.prototype.updateRecord = function (callback) {
  // DONE: AJAX call accessing at the particular article instance's id and updating the data listed below into the table
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // DONE: this is giving the properties of the below data to be updated in the table
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
    // DONE: This is indicating that after the above is inputted into the table then log the data added and if the callback function is there, run the callback function
    .then(function (data) {
      console.log(data);
      if (callback) callback();
    });
};
