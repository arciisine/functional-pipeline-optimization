import {procedural} from './baseline';
import {functional} from './basic';
import {doTest} from '../test';

doTest(procedural, functional);