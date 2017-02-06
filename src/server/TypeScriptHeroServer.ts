import 'reflect-metadata';
import { Container } from './IoC';
import { ServerConnection } from './utilities/ServerConnection';

const connection = Container.get(ServerConnection);

connection.start();
