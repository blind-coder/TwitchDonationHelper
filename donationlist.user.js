// ==UserScript==
// @name            Donationlist helper
// @author          Benjamin 'blindCoder' Schieder
// @namespace       https://www.benjamin-schieder.de/
// @description     Helper script for donation lists on twitch.tv
// @license         Public Domain
// @version         0.3.3
// @include         /https://www.twitch.tv/[^/]*/
// @require         http://bililite.com/inc/bililiteRange.js
// @require         http://bililite.com/inc/jquery.sendkeys.js
// @run-at          document-end
// @compatible      Greasemonkey
// ==/UserScript==

/*
 * This file is a Greasemonkey user script. To install it, you need
 * the Firefox plugin "Greasemonkey" (URL: http://greasemonkey.mozdev.org/)
 * After you installed the extension, restart Firefox and revisit
 * this script. Now you will see a new menu item "Install User Script"
 * in your tools menu.
 *
 * To uninstall this script, go to your "Tools" menu and select
 * "Manage User Scripts", then select this script from the list
 * and click uninstall :-)
 */

$(document).ready(function(){
	//object constructor
	function donationlist(){
		console.log("donationlist: constructor start");
		this.donorRegex = new RegExp(/([0-9]+)\. ([a-zA-Z0-9_-]*) ([0-9\.]*).*(\$|£|USD|EUR|[A-Z]{3}) ?(.*)/);
		console.log("donationlist: constructor end");
	}

	donationlist.prototype.findArea = function(){
		var tas = $("textarea");
		for (var i=0; i<tas.length; i++){
			var content = tas[i].value.split("\n");
			if (content[0].match(this.donorRegex)){
				this.textarea = tas[i];
				return;
			}
		}
	};

	donationlist.prototype.createEditButton = function(){
		var that = this;
		var btn = $("<span class='button'>Edit</span>");
		btn.on("click", function(){ that.createEditWindow(); });
		$(this.textarea).after(btn);
	};

	donationlist.prototype.parseDonors = function(){
		var retVal = {};
		var list = this.textarea.value.split("\n");
		for (var i=0; i<list.length; i++){
			var donor;
			list[i] = list[i].replace(/\$ ?([0-9]+(\.[0-9]+)?)/, "$1$");
			if ((donor = list[i].match(this.donorRegex))){
				retVal[donor[2]] = {amount: donor[3], currency: donor[4], comment: donor[5]};
			}
		}

		return retVal;
	};

	donationlist.prototype.save = function() {
		var donors = [];
		var tr = $("#donationlist table tr");
		for (var i=1; i<tr.length; i++){
			var donor = {};
			var ttr = $(tr[i]);
			var td = ttr.find("td");
			donor.name = td[0].innerHTML;
			donor.amount = $(td[1]).find("input").val();
			donor.currency = $(td[2]).find("input").val();
			donor.comment = $(td[3]).find("input").val();

			donors.push(donor);
		}
		donors.sort(function(a, b){ return b.amount - a.amount; });

		this.textarea.value = "";
		for (var j = 0; j < donors.length; j++){
			var d = donors[j];
			this.textarea.value += (j+1)+". "+d.name+" "+d.amount+d.currency+" "+d.comment+"\n";
		}

		$("#donationlist").remove();

		$(this.textarea).sendkeys(" ");
	};

	donationlist.prototype.createEditWindow = function(){
		var donors = this.parseDonors();
		console.log("donationlist: donors");
		console.log(donors);

		console.log("donationlist: createEditWindow");
		this.editDiv = $("<div id='donationlist'>");
		$("body").append(this.editDiv);

		this.editDiv.css("position", "absolute");
		this.editDiv.css("top", "100px");
		this.editDiv.css("left", "100px");
		this.editDiv.css("width", (window.innerWidth-200)+"px");
		this.editDiv.css("height", (window.innerHeight-200)+"px");
		this.editDiv.css("background-color", "white");
		this.editDiv.css("z-index", "9999");
		this.editDiv.css("overflow", "scroll");
		this.editDiv.append("<h1>Donation List Helper</h1>");
		var table = $("<table>");
		table.append("<tr><td>Name</td><td>Amount</td><td>Currency</td><td>Comment</td></tr>");
		this.editDiv.append(table);

		var keys = [];
		$.each(donors, function(k,v){
			keys.push(k);
		});
		keys.sort();

		for (var i=0; i<keys.length; i++){
			var name = keys[i];
			var data = donors[name];
			table.append("<tr><td>"+name+"</td><td><input id='"+name+"_amount' value='"+data.amount+"'></td><td><input id='"+name+"_currency' value='"+data.currency+"'></td><td><input id='"+name+"_comment' value='"+data.comment+"'></td></tr>");
		}

		var save = $("<span class='button'>Save</span>");
		save.css("right", "10px");
		save.css("bottom", "10px");
		save.css("position", "absolute");
		var that = this;
		save.on("click", function(){ that.save(); });
		this.editDiv.append(save);
	};

	setTimeout(checkIfReady, 1000);
	function checkIfReady(){
		if ($("#panels-edit-contain").length <= 0){
			setTimeout(checkIfReady, 1000);
			console.log("donationlist: not ready yet...");
			return;
		}

		var btn = $("<span class='button'>Donationhelper</span>");
		console.log($("#panels-edit-contain"));
		console.log(btn);
		$("#panels-edit-contain").append(btn);

		btn.on("click", function(){
			//instantiate and run
			console.log("donationlist: create object");
			var d = new donationlist();
			console.log("donationlist: findArea");
			d.findArea();

			if (d.textarea){
				d.createEditButton();
			} else {
				alert("No donation list found");
			}
		});
	}
});
