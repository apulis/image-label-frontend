import React, { Component } from 'react';
import update from 'immutability-helper';

export default function withHistory(Comp) {
  return class HistoryLayer extends Component {
    constructor(props) {
      super(props);      
      this.state = {
        figures: this.getFigures(), // mapping from label name to a list of Figure structures
        unfinishedFigure: null,
        figuresHistory: [],
        unfinishedFigureHistory: [],
      };

      this.pushState = this.pushState.bind(this);
      this.popState = this.popState.bind(this);
    }

    flipY(figures) {
      // flip the y-coordinate
      const f = {};
      Object.keys(figures).forEach(label => {
        f[label] = figures[label].map(figure => {
          if (figure.type !== 'polygon' && figure.type !== 'bbox')
            return figure;

          let tracingOptions;
          if (figure.tracingOptions && figure.tracingOptions.enabled) {
            tracingOptions = {
              ...figure.tracingOptions,
              trace: this.transformPoints(figure.tracingOptions.trace),
            };
          } else {
            tracingOptions = figure.tracingOptions;
          }

          return {
            ...figure,
            points: this.transformPoints(figure.points),
            tracingOptions,
          };
        });
      });
      return f;
    }

    transformPoints(points) {
      const { height } = this.props;
      return points.map(({ lat, lng }) => ({
        lat: height - lat,
        lng,
      }));
    }

    componentDidUpdate(prevProps, prevState) {
      const { onLabelChange, height, width, labels, isDetail, labelData } = this.props;
      const { figures } = this.state;

      if (prevProps.labels !== labels) {
        this.setState({ figures: this.getFigures() });
      }
      
      if ((figures !== prevState.figures) && isDetail) {
        onLabelChange({
          labels: this.flipY(figures),
          height,
          width,
        });
      }
    }

    getFigures = () => {
      const { labelData, labels } = this.props;
      let figures = {};
      labels.map(label => (figures[label.id] = []));
      figures.__temp = [];
      Object.keys(labelData).forEach(key => {
        figures[key] = (figures[key] || []).concat(labelData[key]);
      });
      return this.flipY(figures);
    }

    pushState(stateChange, cb) {
      this.setState(
        state => ({
          figuresHistory: update(state.figuresHistory, {
            $push: [state.figures],
          }),
          unfinishedFigureHistory: update(state.unfinishedFigureHistory, {
            $push: [state.unfinishedFigure],
          }),
          ...stateChange(state),
        }),
        cb && cb()
      );
    }

    popState() {
      this.setState(state => {
        let { figuresHistory, unfinishedFigureHistory } = state;
        if (!figuresHistory.length) {
          return {};
        }

        figuresHistory = figuresHistory.slice();
        unfinishedFigureHistory = unfinishedFigureHistory.slice();
        const figures = figuresHistory.pop();
        let unfinishedFigure = unfinishedFigureHistory.pop();

        if (unfinishedFigure && !unfinishedFigure.points.length) {
          unfinishedFigure = null;
        }

        return {
          figures,
          unfinishedFigure,
          figuresHistory,
          unfinishedFigureHistory,
        };
      });
    }

    chnageHOCState = (key, val) => {
      this.setState({ [key]: val });
    }

    render() {
      const { props, state, pushState, popState, chnageHOCState } = this;
      const { figures, unfinishedFigure } = state;
      const passedProps = {
        pushState,
        popState,
        figures,
        unfinishedFigure,
        chnageHOCState
      };
      return <Comp {...passedProps} {...props} />;
    }
  };
}
