"use strict";
var chai = require("chai");
var expect = require('chai').expect;
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var sinonAsPromised = require('sinon-as-promised');
var RSB = require('../src/rsb');
var autobahn = require('autobahn');

chai.should();
chai.use(sinonChai);

var wampMock;

function WampMock() {
  this.isOpen = true;
  this.publishedMessages = {};
  this.subscribedScopes = {};

  this.subscriptionResult = sinon.stub();
  this.subscriptionResult.resolves('subscription stub');
  this.subscriptionResult.onCall(0).rejects('subscription stub first call fails');

  this.rpcStub = sinon.stub();
  this.rpcStub.resolves('rpc stub');
  this.rpcStub.onCall(0).rejects('rpc stub first call fails');

}

WampMock.prototype.getScopes = function() {
  return Object.keys(this.subscribedScopes);
};

WampMock.prototype.subscribe = function(scope, callback) {
  if (!(scope in this.subscribedScopes)) {this.subscribedScopes[scope] = []}
  this.subscribedScopes[scope].push(callback);
  return this.subscriptionResult();
};

WampMock.prototype.publish = function(scope, arr) {
  if (!(scope in this.publishedMessages)) {this.publishedMessages[scope] = []}
  this.publishedMessages[scope].push(arr)
};

WampMock.prototype.call = function(scope, args) {
  return this.rpcStub();
};


describe('RSB', function() {
  beforeEach(function () {
    this.sinon = sinon.sandbox.create();
    global.document = {location: {protocol: ''}};
    wampMock = new WampMock();
    this.sinon.stub(autobahn.Connection.prototype, 'open', function(){
      this.onopen(wampMock, 'connection stub');
    });
  });

  afterEach(function () {
    this.sinon.restore();
  });


  it('should initialize a stubbed connection', function(done) {
    var rsb = new RSB();
    global.document = {location: {protocol: ''}};
    var rsb = new RSB();
    rsb.connect(undefined, function(){
      done();
    });
  });

  it('should return true for isConnected()', function(done) {
    var rsb = new RSB();
    rsb.connect(undefined, function(){
      if (rsb.isConnected()) {
        done();
      }
    });
  });

  it('should createPingPong()', function(done) {
    var rsb = new RSB();
    rsb.createPingPong();
    expect(wampMock.getScopes()).to.have.length(0);
    rsb.connect(undefined, function(){
      rsb.createPingPong();
      expect(wampMock.getScopes()).to.have.length(1);
      expect("com.wamp.ping" in wampMock.subscribedScopes).to.be.true;
      done();
    });
  });

  it('should createListener()', function(done) {
    var rsb = new RSB();
    var params = {scope:'/foo/bar', type:RSB.STRING, callback: function(val){}};
    rsb.createListener(params);
    expect(wampMock.getScopes()).to.have.length(0);
    rsb.connect(undefined, function() {
      rsb.createListener(params);
      expect(wampMock.getScopes()).to.have.length(1);
      expect("foo.bar" in wampMock.subscribedScopes).to.be.true;
      done();
    });
  });


});
