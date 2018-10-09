import React from "react";
import { Subject, combineLatest, OperatorFunction, UnaryFunction, Observable, Subscription } from "rxjs";
import { map, startWith, mapTo } from "rxjs/operators";
import ReObserve, { dispatch, fromAction } from "@hlhr202/reobserve";
import ReactDOM from "react-dom";
import { IActionEmit } from "../node_modules/@hlhr202/reobserve/lib/type";
// import { getDisplayName } from '../shared'

declare module "rxjs/internal/Observable" {
	interface Observable<T> {
		pipe<A>(operator: (source: Observable<T>) => React.ComponentClass<A>): React.ComponentClass<A>;
	}
}

const toRender: <T, A>(
	render: (data: T, props: React.Props<React.ComponentClass<A>> & A) => React.ReactNode
) => UnaryFunction<Observable<T>, React.ComponentClass<A>> = renderFunction => source => {
	class Component extends React.PureComponent<any, { data?: any }> {
		private subscription!: Subscription;
		constructor(props: any) {
			super(props)
			this.state = {
				data: undefined
			}
		}
		componentDidMount() {
			this.subscription = source.subscribe(data => this.setState({ data }));
		}
		componentWillUnmount() {
			this.subscription.unsubscribe();
		}
		render() {
			return this.state.data ? renderFunction(this.state.data, this.props as any) : null;
		}
	}
	(Component as any).displayName = (renderFunction as any).displayName || (renderFunction as any).name || "Component";
	return Component as any;
};

interface INumbers {
	numbers: Array<number>;
}

const number$ = new ReObserve<INumbers>({ numbers: [0, 1, 2, 3] })
	.mergeReduce(fromAction("INCREMENT").pipe<number[]>(map(action => action.payload)), (curr, payload) => ({
		numbers: curr.numbers.map((n, i) => n + payload[i])
	}))
	.mergeReduce(fromAction("DECREMENT").pipe<number[]>(map(action => action.payload)), (curr, payload) => ({
		numbers: curr.numbers.map((n, i) => n - payload[i])
	}));

const App = number$.asObservable().pipe<{ testProps: string }>(
	toRender((state, props) => (
		<>
			<button onClick={() => dispatch({ type: "DECREMENT", payload: [1, 2, 3, 4] })}>-</button>
			{state.numbers.map((n, i) => (
				<span key={i}> {n} </span>
			))}
			<button onClick={() => dispatch({ type: "INCREMENT", payload: [1, 2, 3, 4] })}>+</button>
		</>
	))
);

ReactDOM.render(<App testProps="Test" />, document.getElementById("root"));

export default toRender;
