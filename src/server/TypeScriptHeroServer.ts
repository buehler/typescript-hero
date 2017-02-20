import 'reflect-metadata';
import '../common/ts-parsing/declarations';
import '../common/ts-parsing/exports';
import '../common/ts-parsing/imports';
import '../common/ts-parsing/resources';
import { Container } from './IoC';
import { ServerConnection } from './utilities/ServerConnection';

const connection = Container.get(ServerConnection);

connection.start();
