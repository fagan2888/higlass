import slugid from 'slugid';
import React from 'react';
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';

class MoveableTrack extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            controlsVisible: false
        }
    }

    handleMouseEnter() {
        this.setState({
            controlsVisible: true
        });
    }

    handleMouseLeave() {
        this.setState({
            controlsVisible: false
        });
    }

    render() {
        let Handle = SortableHandle(() => 
                <img 
                    onClick={() => { this.handleCloseView(view.uid)}}
                    src="images/enlarge.svg" 
                    style={this.getMoveImgStyle()}
                    width="10px" 
                />
                )
        let controls = null;

        if (this.state.controlsVisible) {
            controls = (<div>
                            <img 
                                onClick={() => { this.props.handleCloseTrack(this.props.uid); }}
                                src="images/cross.svg" 
                                style={this.getCloseImgStyle()}
                                width="10px" 
                            />
                            <Handle />
                    </div>)
        }

        return (
            <div 
                className={this.props.className} 
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseLeave.bind(this)}
                style={{
                    height: this.props.height,
                    width: this.props.width,
                    position: "relative" }}
            >
                {controls}
                {this.props.item.value}
            </div>
        )

    }
}

class VerticalTrack extends MoveableTrack {
    constructor(props) {
        super(props);
    }

    getCloseImgStyle() {
        let closeImgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

    getMoveImgStyle() {
        let moveImgStyle = { right: 5,
                         top: 18,
                         position: 'absolute',
                         opacity: .5}

        return moveImgStyle;
    }

}


const VerticalItem = SortableElement((props) => { 
    return (<VerticalTrack 
                className={props.className}
                handleCloseTrack={props.handleCloseTrack}
                height={props.height}
                uid={props.uid}
                width={props.width}
                item={props.item}
            />)});

class HorizontalTrack extends MoveableTrack {
    constructor(props) {
        super(props);

        this.state = {
            controlsVisible: false
        }
    }

    getCloseImgStyle() {
        let closeImgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

    getMoveImgStyle() {
        let moveImgStyle = { right: 18,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return moveImgStyle;
    }
}

const HorizontalItem = SortableElement((props) => { 
    return (<HorizontalTrack 
                className={props.className}
                handleCloseTrack={props.handleCloseTrack}
                height={props.height}
                uid={props.uid}
                width={props.width}
                item={props.item}
            />)});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, sortableHandlers,height, width, handleCloseTrack,itemReactClass}) => {
    let itemElements = items.map((item, index) =>
            React.createElement(itemReactClass,
                {key:   slugid.nice(),
				className: itemClass,
					sortingIndex: sortingIndex,
					index: index,
					uid: item.uid,
					height: item.height,
                    width: item.width,
                    item: item,
					useDragHandle: useDragHandle,
                    handleCloseTrack: handleCloseTrack
                })
			)

	return (
		<div 
            className={className} 
            style={{height: height,
                    width: width}}
            {...sortableHandlers}
        >
			{itemElements}
		</div>
	);
});

class ListWrapper extends React.Component {
	constructor({items}) {
		super();
		this.state = {
			items, isSorting: false
		};
	}

    componentWillReceiveProps(nextProps) {
        this.setState ({
            items: nextProps.items
        })
    }

	onSortStart() {
		let {onSortStart} = this.props;
		this.setState({isSorting: true});

		if (onSortStart) {
			onSortStart(this.refs.component);
		}
	};

    onSortEnd({oldIndex, newIndex}) {
		let {onSortEnd} = this.props;
        let {items} = this.state;

        this.setState({items: arrayMove(items, oldIndex, newIndex), isSorting: false});

		if (onSortEnd) {
			onSortEnd(this.state.items);
		}
    };

	render() {

		const Component = this.props.component;
		const {items, isSorting} = this.state;
		const props = {
			isSorting, items,
			onSortEnd: this.onSortEnd.bind(this),
			onSortStart: this.onSortStart.bind(this),
			ref: "component"
		}

		return <Component {...this.props} {...props} />
	}
}

ListWrapper.propTypes = {
    items: React.PropTypes.array,
    className: React.PropTypes.string,
    itemClass: React.PropTypes.string,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    onSortEnd: React.PropTypes.func,
    component: React.PropTypes.func
}

ListWrapper.defaultProps = {
    className: "list stylizedList",
    itemClass: "item stylizedItem",
    width: 400,
    height: 600
};


export class HorizontalTiledPlot extends React.Component {
    constructor(props) {
        super(props);

    }


    render() {
        let thisHeight = this.props.tracks
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let imgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        let newItems = this.props.tracks.map((d) => {
            let uid = d.uid;
            if (!uid)
                uid = slugid.nice();

            return {uid: uid, width: this.props.width, height: d.height, value: d.value };
        });


        return (
                <div style={{position: "relative"}}>
                    <ListWrapper
                        component={SortableList}
                        helperClass={"stylizedHelper"}
                        className={"list stylizedList"} 
                        itemClass={"stylizedItem"}
                        items={newItems} 
                        height={thisHeight}
                        width={this.props.width}
                        useDragHandle={true}
                        handleCloseTrack={this.props.handleCloseTrack}
                        onSortEnd={this.props.handleSortEnd}
                        itemReactClass={HorizontalItem}
                    />
                </div>
        )

    }
}

export class VerticalTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        let thisWidth = this.props.tracks
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        let newItems = this.props.tracks.map((d) => {
            let uid = d.uid;
            if (!uid)
                uid = slugid.nice();

            return {uid: uid, height: this.props.height, width: d.width, value: d.value };
        });

        return (
                <ListWrapper
                    component={SortableList}
                    axis={'x'}
                    helperClass={"stylizedHelper"}
                    className={"list stylizedList horizontalList"} 
                    itemClass={"stylizedItem horizontalItem"}
                    items={newItems} 
                    height={this.props.height}
                    width={thisWidth}
                    useDragHandle={true}
                    handleCloseTrack={this.props.handleCloseTrack}
                    itemReactClass={VerticalItem}
                />
        )

    }
}

HorizontalTiledPlot.propTypes = {
    tracks: React.PropTypes.array
}