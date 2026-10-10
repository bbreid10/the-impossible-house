'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {moderateChat}=require('../moderation.js');
test('Chat censors common profanity without altering ordinary text',()=>{
  assert.equal(moderateChat('Meet me in the Hall'), 'Meet me in the Hall');
  assert.match(moderateChat('You are a bitch'),/\*{5}/);
  assert.match(moderateChat('FUCK you'),/\*{4}/);
  assert.equal(moderateChat('Hey shit!'), 'Hey ****!');
});
test('Removes addresses and control characters, and limits message length',()=>{
  assert.match(moderateChat('Open https://example.com for details'),/\[link removed\]/);
  assert.match(moderateChat('Email test@example.com'),/\[contact removed\]/);
  assert.match(moderateChat('Call 123-456-7890'),/\[number removed\]/);
  assert.equal(moderateChat('  hello\n  house  '),'hello house');
  assert.ok(moderateChat('a'.repeat(200)).length<=160);
});
