/*jshint browser: true, devel:true*/
(function () {

"use strict";

  // pages
  var pageMain = document.getElementById('pageMain'),
      pageAdd = document.getElementById('pageAdd');

  // buttons
  var btnAdd = document.getElementById('btnAdd'),
      btnCancel = document.getElementById('btnCancel'),
      btnSubmit = document.getElementById('btnSubmit'),
      btnReset = document.getElementById('btnReset'),
      btnSearch = document.getElementById('btnSearch'),
      pageAddBack = document.getElementById('pageAddBack');


  // items
  var currentStations = document.getElementById('currentStations'),
      inputSearch = document.getElementById('inputSearch'),
      spinner = document.getElementById('spinner'),
      searchResults = document.getElementById('searchResults');

  // display first page
  pageMain.style.display = "block";

  parseIncommingData(window.location.hash.substring(1));

  function parseIncommingData (rawdata) {
    // alert(rawdata);
    // document.getElementById('dump').innerHTML = rawdata;
    rawdata = decodeURIComponent(rawdata);
    // document.getElementById('dump').innerHTML += "\n\n==================\n\n";
    // document.getElementById('dump').innerHTML += rawdata;
    // alert(rawdata);
    var data;

    // try { data = JSON.parse(rawdata); }catch(e){document.getElementById('dump').innerHTML += "\n\nparse fail\n\n";}
    try { data = JSON.parse(rawdata); }catch(e){}
    // document.getElementById('dump').innerHTML += "\n\n==================\n\n";
    // document.getElementById('dump').innerHTML += data.route;
    // console.log(data.route.length);
    if (data) {
      // document.getElementById('dump').innerHTML += "<br><br>has data";
      for (var i = data.route.length - 1; i >= 0; i--) {
        var button = document.createElement('button');
        button.className = 'button list-button';
        button.innerHTML = '&times;';
        button.onclick = onRemoveItem;

        var item = document.createElement("a");
        item.appendChild(button);

        var text = document.createTextNode(data.route[i].from);
        item.appendChild(text);

        item.setAttribute("class","list-group-item");
        item.setAttribute("data-locationid", data.route[i].locationid);
        item.setAttribute("data-from", data.route[i].from);
        currentStations.appendChild(item);
      }
      return;
    }

    currentStations.innerHTML = 'No stations';
    return;
  }

  btnAdd.onclick = function (){
    goToPage(pageMain, pageAdd);
  };

  btnCancel.onclick = function (){
    // e.preventDefault();
    window.location = 'pebblejs://close';
  };

  btnReset.onclick = function (e){
    e.preventDefault();
    // window.location = 'pebblejs://close#reset';
  };

  btnSubmit.onclick = function (e){
    e.preventDefault();
    window.location = "pebblejs://close#" + encodeURIComponent(saveOptions());
    console.log("pebblejs://close#" + encodeURIComponent(saveOptions()));

  };

  btnSearch.onclick = function (e){
    e.preventDefault();
    doSearch();
  };

  pageAddBack.onclick= function (){
    goToPage(pageAdd, pageMain);
  };

  inputSearch.onkeydown = function (e){
    if (e.keyIdentifier === 'Enter') {
      doSearch();
    }
  };

  function doSearch () {
    if (inputSearch.value) {
      spinner.style.display = 'block';
      stationSearch(inputSearch.value);
    }
  }

  function onResultClick (e) {
    // console.log(e.toElement.innerHTML);
    // console.log(e.toElement.getAttribute('data-locationid'));
    // console.log(e.toElement.getAttribute('data-from'));
    addStation(e.toElement.getAttribute('data-locationid'), e.toElement.getAttribute('data-from'));
  }

  function onRemoveItem (e) {
    // console.log(e.toElement.parentNode.getAttribute('data-from'));
    e.toElement.parentNode.parentNode.removeChild(e.toElement.parentNode);
    // console.log(e);
  }

  function addStation (locationid, from) {
    var button = document.createElement('button');
    button.className = 'button list-button';
    button.innerHTML = '&times;';
    button.onclick = onRemoveItem;

    var item = document.createElement("a");
    item.appendChild(button);

    var text = document.createTextNode(from);
    item.appendChild(text);

    item.setAttribute("class","list-group-item");
    item.setAttribute("data-locationid", locationid);
    item.setAttribute("data-from", from);

    if (currentStations.innerHTML === 'No stations') {
      currentStations.innerHTML = '';
    }

    currentStations.appendChild(item);

    // cleanup
    searchResults.innerHTML = '';
    spinner.style.display = 'none';
    inputSearch.value = '';
    goToPage(pageAdd, pageMain);
  }

  function saveOptions () {
    var current = currentStations.childNodes;
    var options = {};
    options.route = [];

    for (var i = current.length - 1; i >= 0; i--) {
      options.route[i] = {};
      options.route[i].from = current[i].getAttribute('data-from');
      options.route[i].locationid = current[i].getAttribute('data-locationid');
    }
    // console.log(options);
    return JSON.stringify(options);
  }

  /**
   * [goToPage description]
   * @param  {[type]} from [description]
   * @param  {[type]} to   [description]
   * @return {[type]}      [description]
   */
  function goToPage(from, to){
    from.style.display = "none";
    to.style.display = "block";
  }

  /**
   * Sample function to query Github repositories that contain pebble
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  function stationSearch(query){
    var apiUrl = './findlocation.php?from='+ query;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", apiUrl, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4 || xhr.status !== 200){
        searchResults.innerHTML = 'Network timeout';
        return;
      }

      spinner.style.display = 'block';
      stationSearchCallback(xhr.responseText);
    };
    xhr.send();
  }

  function stationSearchCallback (data) {
    if (data) {
      var json = JSON.parse(data);
      if (json.findlocationresult.from.location) {
        var sites = json.findlocationresult.from.location;
        sites.reverse();
        searchResults.innerHTML = '';
        for (var i = sites.length - 1; i >= 0; i--) {
          var newLi = document.createElement("a");
          newLi.innerHTML = sites[i].displayname;
          newLi.setAttribute("class","list-group-item search-item");
          newLi.setAttribute("data-locationid", sites[i].locationid);
          newLi.setAttribute("data-from", sites[i].displayname);
          newLi.onclick = onResultClick;
          searchResults.appendChild(newLi);
        }
      }
    }
    spinner.style.display = 'none';
    if (!searchResults.innerHTML) { searchResults.innerHTML = 'No stations found'; }
  }

})();
