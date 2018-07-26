import * as React from "react";
import ReObserve from "@hlhr202/reobserve";

export type IReactComponent<P = any> =
	| React.StatelessComponent<P>
	| React.ComponentClass<P>;

function observe<IObserved = {}, IProps = {}>(
	reObserve: ReObserve<IObserved>
) {
	const wrapper: <T extends IReactComponent>(WrappedComponent: T) => T = WrappedComponent => {
		class Injected extends React.Component<IProps> {
			readonly state = reObserve.current;
			componentDidMount() {
				reObserve.subscribe(next => {
					this.setState(next);
				});
			}
			render() {
				const { children, ...otherProps } = this.props as any;
				const props = Object.assign({}, otherProps, this.state);
				return React.createElement(WrappedComponent as React.ComponentClass<any>, props, children);
			}
		}
		return Injected as any;
	};
	return wrapper;
}

export { observe };
