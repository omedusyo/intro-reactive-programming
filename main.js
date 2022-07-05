
// TODO: Can a stream have multiple errors?
// TODO: When should we run the `construct-stream` unction?
//       Immediately... or when we have a first subscriber?
//         Let's try the first subscriber...

function stream(cons) {
  const subscribers = [];

  const notStarted = 0;
  const running = 1;
  let streamState = notStarted;

  function send(x) {
    if (streamState == running) {
      subscribers.forEach(onReceive => {
        onReceive(x);
      }); 
    }
  }

  const s = {
    _type: "stream",
    subscribe(onReceive) {
      subscribers.push(onReceive);
      if (streamState == notStarted) {
        streamState = running;
        cons(send);
      }
    }
  };

  return s;
}

function map(s0, f) {
  const s1 = stream(onReceive => {
    s0.subscribe(x => {
      onReceive(f(x));
    });
  });
  return s1;
}

function fold(s0, initState, update) {
  let state = initState;
  const s1 = stream(onReceive => {
    onReceive(state);
    s0.subscribe(action => {
      state = update(state, action);
      onReceive(state);
    });
  });
  return s1;
}

function filter(s0, test) {
  const s1 = stream(onReceive => {
    s0.subscribe(x => {
      if (test(x)) {
        onReceive(x);
      }
    });
  });
  return s1;
}

function just(x) {
  const s = stream(onReceive => {
    onReceive(x);
  });
  return s;
}

function ticks(delayInMS) {
  const s = stream(send => {
    setInterval(() => {
      send(0)
    }, delayInMS);
  });
  return s;
}

function flatten(s0) {
  const s1 = stream(send => {
    s0.subscribe(newStream => {
      newStream.subscribe(x => {
        send(x);
      });
    });
  });
  return s1;
}

function fromEvent(dom, eventName) {
  const s = stream(send => {
    dom.addEventListener(eventName, e => {
      send(e);
    });
  });
  return s;
}

function merge(a, b, first = (x => x), second = (y => y)) {
  const s = stream(send => {
    a.subscribe(x => send(first(x)));
    b.subscribe(y => send(second(y)));
  });
  return s;
}

function combineLatest(A, B, initA, initB) {
  let mostRecentA = initA;
  let mostRecentB = initB;
  const s = stream(send => {
    A.subscribe(x => {
      mostRecentA = x;
      send(mostRecetA, mostRecentB);
    });
    B.subscribe(y => {
      mostRecentB = y;
      send(mostRecetA, mostRecentB);
    });
  });
  return s;
}

const myTicks = ticks(1000)

const ones = map(myTicks, _ => 1);
const nats = fold(ones, 0, (state, action) => state + action);

const squares = map(nats, x => x*x);

const evens = filter(nats, x => x % 2 == 0);

const singleton = just(512);

const doubleSingleton = just(just(512));

// flatten(doubleSingleton).subscribe(x => {
//   console.log(x);
// })

// nats.subscribe(x => {
//   console.log("first-subscriber", x);
// });

// nats.subscribe(x => {
//   console.log("second-subscriber", x);
// });


const bodyDOM = document.querySelector("body");

const buttonDOM1 = document.createElement("button");
buttonDOM1.innerHTML = "click me (1)";

const buttonDOM2 = document.createElement("button");
buttonDOM2.innerHTML = "click me (2)";

const inputDOM = document.createElement("input");

const clicks =
  merge(
    map(fromEvent(buttonDOM1, "click"), e => 0),
    map(fromEvent(buttonDOM2, "click"), e => 1)
  )

const inputChange = fromEvent(inputDOM, "input");

bodyDOM.appendChild(buttonDOM1);
bodyDOM.appendChild(buttonDOM2);
bodyDOM.appendChild(inputDOM);


const startStream = just("start");

merge(clicks, startStream).subscribe(p => {
  console.log(p);
});


inputChange.subscribe(e => {
  console.log(e.target.value);
})

