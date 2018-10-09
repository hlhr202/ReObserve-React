import React from "react";
import { Subject, combineLatest, OperatorFunction, UnaryFunction, Observable } from "rxjs";
import { map, startWith, mapTo } from "rxjs/operators";
import ReObserve from "@hlhr202/reobserve";
import ReactDOM from "react-dom";
// import { getDisplayName } from '../shared'

declare module "rxjs/internal/Observable" {
	interface Observable<T> {
		pipe<A>(op1: (data: T, props: A) => React.Props<React.ComponentClass<A>> & A): React.ComponentClass<A>;
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

interface ICounter {
	count: number;
}

const counter$ = new ReObserve<ICounter>({ count: 0 })
	.mergeReduce(ReObserve.fromAction("INCREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count + next }))
	.mergeReduce(ReObserve.fromAction("DECREMENT").pipe(mapTo(1)), (curr, next) => ({ count: curr.count - next }));

const App = counter$.asObservable().pipe<{ testProps: string }>(
	toComponent((counter, props) => (
		<>
			<div>{props.testProps}</div>
			<button onClick={() => ReObserve.dispatch({ type: "DECREMENT" })}>-</button>
			<div>{counter.count}</div>
			<button onClick={() => ReObserve.dispatch({ type: "INCREMENT" })}>+</button>
		</>
	))
);

ReactDOM.render(<App testProps="Test" />, document.getElementById("root"));

export default toComponent;
