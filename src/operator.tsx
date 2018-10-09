import React from "react";
import { Subject, combineLatest, OperatorFunction, UnaryFunction, Observable } from "rxjs";
import { map, startWith, mapTo } from "rxjs/operators";
import ReObserve, { dispatch, fromAction } from "@hlhr202/reobserve";
import ReactDOM from "react-dom";
import { IActionEmit } from "../node_modules/@hlhr202/reobserve/lib/type";
// import { getDisplayName } from '../shared'

declare module "rxjs/internal/Observable" {
	interface Observable<T> {
		pipe<A>(op1: OperatorFunction<T, A>): Observable<A>;
		pipe<A, D extends T>(
			op1: (data: D, props: A) => React.Props<React.ComponentClass<A>> & A
		): React.ComponentClass<A>;
	}
}

const toComponent: <T, A>(f: (data: T, props: A) => React.ReactNode) => UnaryFunction<T, A> = f => source => {
	class Component extends React.PureComponent<any> {
		mounted: boolean = false;
		subject = new Subject();
		view: React.ReactNode = null;
		view$ = combineLatest(this.subject.pipe(startWith(this.props)), source as any).pipe(
			map(([props, data]: any) => f(data, props))
		);
		handleView = (view: React.ReactNode) => {
			this.view = view;
			if (this.mounted) this.forceUpdate();
		};
		subscription = this.view$.subscribe(this.handleView);
		componentDidMount() {
			this.mounted = true;
		}
		componentWillUnmount() {
			this.mounted = false;
			this.subscription.unsubscribe();
		}
		componentDidUpdate(prevProps: any) {
			if (prevProps !== this.props) {
				this.subject.next(this.props);
			}
		}
		render() {
			return this.view;
		}
	}
	// Component.displayName = getDisplayName(f)
	return Component as any;
};

interface INumbers {
	numbers: Array<number>;
}

const number$ = new ReObserve<INumbers>({ numbers: [0, 1, 2, 3] })
	.mergeReduce(fromAction("INCREMENT").pipe(map(action => action.payload)), (curr, payload) => ({
		numbers: curr.numbers.map((n, i) => n + payload[i])
	}))
	.mergeReduce(fromAction("DECREMENT").pipe(map(action => action.payload)), (curr, payload) => ({
		numbers: curr.numbers.map((n, i) => n - payload[i])
	}));

const App = number$.asObservable().pipe<{ testProps: string }, INumbers>(
	toComponent((state, props) => (
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

export default toComponent;
