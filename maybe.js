function makeMaybe(obj) {
  if(obj === undefined || obj === null) {
    return new Nothing();
  }
  
  return new Something(obj);
}

function Nothing() {
  this.isSomething = false;
  this.orElse = (value) => {
    return value;
  }
  this.then = (...args) => {
    return new Nothing();
  }
  return this;
}

function Something(value) {
  this.isSomething = true;
  this.value = value;

  this.orElse = (...args) => {
    return this.value;
  }

  this.then = (fn) => {
    return makeMaybe(fn(this.value));
  }

  return this;
}

module.exports = {of: makeMaybe, Nothing, Something}