import * as React from "react";
import * as ReactDOM from "react-dom";
import { observe } from "./provider";
import ReObserve from "@hlhr202/reobserve";
import { mapTo } from "rxjs/operators";

interface ICounter {
	count: number;
}
const initialCounter: ICounter = {
	count: 0
};

const counter$ = new ReObserve<ICounter>(initialCounter)
	.mergeReduce(ReObserve.fromAction("INCREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count + next }))
	.mergeReduce(ReObserve.fromAction("DECREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count - next }));

class ObserverComponent<
	IData = {},
	IProps = {},
	T extends { state: ReObserve<IData> } = { state: ReObserve<IData> }
> extends React.Component<IProps & T, IData> {
	constructor(props: IProps & T) {
		super(props);
        this.state = this.props.state.current;
        this.props.state.subscribe(next => this.setState(next));
	}
}

class Root extends ObserverComponent<ICounter> {
	render() {
		return (
			<>
				<button onClick={() => ReObserve.dispatch({ type: "DECREMENT" })}>-</button>
				<div>{this.state.count}</div>
				<button onClick={() => ReObserve.dispatch({ type: "INCREMENT" })}>+</button>
			</>
		);
	}
}

ReactDOM.render(<Root state={counter$} />, document.getElementById("root"));
