/* @flow */

import { filter, flow } from 'lodash/fp';
import { $ } from '../vendor';
import { Module } from '../core/module';
import {
	BodyClasses,
	currentMultireddit,
	currentSubreddit,
	currentUserProfile,
	loggedInUser,
} from '../utils';
import * as CustomToggles from './customToggles';

export const module: Module<*> = new Module('stylesheet');

module.moduleName = 'stylesheetName';
module.description = 'stylesheetDesc';
module.category = 'appearanceCategory';
module.exclude = [
	'prefs',
	'account',
	'stylesheet',
	'subredditAbout',
];

export const updatesStylesheet = 'https://cdn.redditenhancementsuite.com/updates.css';

module.options = {
	redditThemes: {
		description: 'reddit allows you to customize the appearance of reddit! A reddit theme will be applied anywhere the default reddit style is present and subreddit style is disabled via reddit.',
		type: 'button',
		text: 'learn more',
		callback() {
			window.location.href = 'https://www.reddit.com/r/Enhancement/wiki/faq/srstyle#reddit_themes';
		},
	},
	loadStylesheets: {
		type: 'table',
		description: 'External or subreddit CSS to load.',
		value: [
			[updatesStylesheet, 'everywhere'],
		],
		fields: [{
			name: 'url or subreddit',
			type: 'text',
		}, {
			name: 'applyTo',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere',
			}, {
				name: 'Everywhere but:',
				value: 'exclude',
			}, {
				name: 'Only on:',
				value: 'include',
			}],
			value: 'everywhere',
		}, {
			name: 'applyToSubreddits',
			type: 'list',
			listType: 'subreddits',
		}, {
			name: 'toggleName',
			type: 'text',
		}],
	},
	snippets: {
		type: 'table',
		description: 'CSS snippets to load.',
		value: ([]: Array<[string, string, string, string]>),
		fields: [{
			name: 'snippet',
			type: 'textarea',
		}, {
			name: 'applyTo',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere',
			}, {
				name: 'Everywhere but:',
				value: 'exclude',
			}, {
				name: 'Only on:',
				value: 'include',
			}],
			value: 'everywhere',
		}, {
			name: 'applyToSubreddits',
			type: 'list',
			listType: 'subreddits',
		}, {
			name: 'toggleName',
			type: 'text',
		}],
	},
	bodyClasses: {
		type: 'table',
		description: 'CSS classes to add to &lt;body&gt;.',
		value: ([]: Array<[string, string, string, string]>),
		fields: [{
			name: 'classes',
			type: 'text',
		}, {
			name: 'applyTo',
			type: 'enum',
			values: [{
				name: 'Everywhere',
				value: 'everywhere',
			}, {
				name: 'Everywhere but:',
				value: 'exclude',
			}, {
				name: 'Only on:',
				value: 'include',
			}],
			value: 'everywhere',
		}, {
			name: 'applyToSubreddits',
			type: 'list',
			listType: 'subreddits',
		}, {
			name: 'toggleName',
			type: 'text',
		}],
	},
	subredditClass: {
		type: 'boolean',
		value: true,
		description: `
			When browsing a subreddit, add the subreddit name as a class to the body.
			<br><br>For example, /r/ExampleSubreddit adds <code>body.res-r-examplesubreddit</code>
		`,
	},
	multiredditClass: {
		type: 'boolean',
		value: true,
		description: `
			When browsing a multireddit, add the multireddit name as a class to the body.
			<br><br>For example, /u/ExampleUser/m/ExampleMulti adds <code>body.res-user-exampleuser-m-examplemulti</code>
		`,
	},
	usernameClass: {
		type: 'boolean',
		value: true,
		description: `
			When browsing a user profile, add the username as a class to the body.
			<br><br>For example, /u/ExampleUser adds <code>body.res-user-exampleuser</code>
		`,
	},
	loggedInUserClass: {
		type: 'boolean',
		value: false,
		description: `
			When logged in, add your username as a class to the body.
			<br><br>For example, /u/ExampleUser adds <code>body.res-me-exampleuser</code>
		`,
	},
};

module.beforeLoad = () => {
	if (module.options.subredditClass.value) {
		applySubredditClass();
	}
	if (module.options.usernameClass.value) {
		applyUsernameClass();
	}
	if (module.options.multiredditClass.value) {
		applyMultiredditClass();
	}

	$(CustomToggles.module).on('activated deactivated', applyStyles);
	applyStyles();

	function applyStyles() {
		applyBodyClasses();
		loadStylesheets();
		applyCssSnippets();
	}
};

module.go = () => {
	if (module.options.loggedInUserClass.value) {
		applyLoggedInUserClass();
	}
};

function applySubredditClass() {
	let name = currentSubreddit();
	if (name) {
		name = name.toLowerCase();
		BodyClasses.add(`res-r-${name}`);
	}
}

function applyMultiredditClass() {
	let name = currentMultireddit();
	if (name) {
		name = name.toLowerCase().replace(/\//g, '-');
		BodyClasses.add(`res-${name}`);
	}
}

function applyUsernameClass() {
	let name = currentUserProfile();
	if (name) {
		name = name.toLowerCase();
		BodyClasses.add(`res-user-${name}`);
	}
}

function applyLoggedInUserClass() {
	let name = loggedInUser();
	if (name) {
		name = name.toLowerCase();
		BodyClasses.add(`res-me-${name}`);
	}
}

function applyBodyClasses() {
	const addClasses = module.options.bodyClasses.value
		.filter(row => shouldApply(row[3], row[1], row[2]))
		.map(row => (row[0] || '').split(/[\s,]/))
		.reduce((a, b) => a.concat(b), []);

	const removeClasses = module.options.bodyClasses.value
		.filter(row => !shouldApply(row[3], row[1], row[2]))
		.map(row => (row[0] || '').split(/[\s,]/))
		.reduce((a, b) => a.concat(b), []);

	BodyClasses.add(...addClasses);
	BodyClasses.remove(...removeClasses);
}

const subredditNameRegexp = /^(?:\/?r\/)?([\w_]+)\/?$/;
const urlRegexp = /^(?:https?:\/\/[\w\.]+)?\/\w+/;

function sanitizeStylesheetUrls(stylesheetRows) {
	return stylesheetRows
		.map(([url]) => {
			if (subredditNameRegexp.test(url)) {
				return `/r/${subredditNameRegexp.exec(url)[1]}/stylesheet.css`;
			} else if (urlRegexp.test(url)) {
				return url;
			}
		})
		.filter(x => x);
}

function loadStylesheets() {
	const remove = flow(
		filter(row => !shouldApply(row[3], row[1], row[2])),
		sanitizeStylesheetUrls
	)(module.options.loadStylesheets.value);

	const add = flow(
		filter(row => shouldApply(row[3], row[1], row[2])),
		sanitizeStylesheetUrls,
		filter(url => !remove.includes(url))
	)(module.options.loadStylesheets.value);

	const addElements = add
		.filter(url => findStylesheetElement(url).length === 0)
		.map(url => createStylesheetElement(url))
		.reduce((collection, element) => collection.add(element), $());

	const removeElements = remove
		.map(url => findStylesheetElement(url))
		.reduce((collection, elements) => collection.add(elements), $());


	$(document.head).append(addElements);
	removeElements.remove();
}

function findStylesheetElement(url) {
	if (!url) return $();
	return $('link[rel=stylesheet]')
		.filter(function() {
			return url === this.getAttribute('href');
		});
}

function createStylesheetElement(url) {
	return $('<link rel="stylesheet">')
		.attr('href', url);
}

function applyCssSnippets() {
	function findSnippetElement(css) {
		if (!css) return $();
		return $('style.res-snippet').filter(function() {
			return $(this).text() === css;
		});
	}
	function createSnippetElement(css) {
		return $('<style class="res-snippet">').text(css);
	}

	const addElements = module.options.snippets.value
		.filter(row => shouldApply(row[3], row[1], row[2]) && findSnippetElement(row[0]).length === 0)
		.map(row => createSnippetElement(row[0]))
		.reduce((collection, element) => collection.add(element), $());

	const removeElements = module.options.snippets.value
		.filter(row => !shouldApply(row[3], row[1], row[2]))
		.map(row => findSnippetElement(row[0]))
		.reduce((collection, element) => collection.add(element), $());

	$(document.head).append(addElements);
	removeElements.remove();
}

function shouldApply(toggle, applyTo, applyList) {
	if (toggle && !CustomToggles.toggleActive(toggle)) return false;

	let subreddit = currentSubreddit();
	if (!subreddit) {
		return (applyTo !== 'include');
	}

	subreddit = subreddit.toLowerCase();
	applyList = typeof applyList === 'string' ? applyList.toLowerCase().split(',') : [];

	switch (applyTo) {
		case 'exclude':
			return !(applyList.includes(subreddit) || applyList.includes('all'));
		case 'include':
			return applyList.includes(subreddit) || applyList.includes('all');
		default:
			return true;
	}
}
