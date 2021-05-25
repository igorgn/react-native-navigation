import _ from 'lodash';
import { LayoutStack } from 'react-native-navigation/interfaces/Layout';
import { OptionsTopBarButton } from 'react-native-navigation/interfaces/Options';
import { Options } from '../../index';
import { LayoutStore } from '../LayoutStore';
import ComponentNode from './ComponentNode';
import LayoutNodeFactory from './LayoutNodeFactory';
import Node, { NodeType } from './Node';

export default class ParentNode extends Node {
  children: ParentNode[];

  constructor(layout: any, type: NodeType, parentNode?: ParentNode) {
    super(layout, type, parentNode);
    this.children = layout.children.map((childLayout: any) =>
      LayoutNodeFactory.create(childLayout, this)
    );
  }

  componentDidAppear() {
    this.getVisibleLayout().componentDidAppear();
  }

  componentDidDisappear() {
    this.getVisibleLayout().componentDidDisappear();
  }

  getVisibleLayout(): ComponentNode {
    return this.children[this.children.length - 1].getVisibleLayout();
  }

  getTopParent(): Node {
    if (this.parentNode) return this.parentNode.getTopParent();
    return this;
  }

  mergeOptions(options: Options) {
    this.data.options = _.mergeWith(this.data.options, options, (objValue, srcValue, key) => {
      if (_.isArray(objValue)) {
        if (key === 'rightButtons' || key === 'leftButtons') {
          this.buttonsChanged(objValue, srcValue);
        }
        return srcValue;
      }
      if (key === 'title' && srcValue.component) {
        this.titleChanged(objValue, srcValue);
      }
    });
    this.parentNode?.mergeOptions(options);
  }

  buttonsChanged(_oldButtons: OptionsTopBarButton[], _newButtons: OptionsTopBarButton[]) {}

  titleChanged(_oldComponent: any, _newComponent: any) {}

  resolveOptions(): Options {
    const options = _.merge(_.cloneDeep(this.data.options), this.getVisibleLayout().data.options);
    return _.merge(_.cloneDeep(LayoutStore.getDefaultOptions()), options);
  }

  public getStack(): LayoutStack | undefined {
    if (this.type === 'Stack') {
      return this as LayoutStack;
    } else if (this.parentNode) {
      return this.parentNode.getStack();
    }

    return undefined;
  }
}