import * as React from "react";
import * as ReactDOM from "react-dom";
import { observe } from "./provider";
import ReObserve from "@hlhr202/reobserve";
import { mapTo, map } from "rxjs/operators";

interface ICounter {
	count: number;
}

const counter$ = new ReObserve<ICounter>({ count: 0 })
	.mergeReduce(ReObserve.fromAction("INCREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count + next }))
	.mergeReduce(ReObserve.fromAction("DECREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count - next }));

@observe(counter$)
class Root extends React.Component {
	get store() {
		return this.props as ICounter;
	}
	render() {
		return (
			<>
				<button onClick={() => ReObserve.dispatch({ type: "DECREMENT" })}>-</button>
				<div>{this.store.count}</div>
				<button onClick={() => ReObserve.dispatch({ type: "INCREMENT" })}>+</button>
			</>
		);
	}
}

ReactDOM.render(<Root />, document.getElementById("root"));
