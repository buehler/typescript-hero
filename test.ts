// let a = 'asdf';

// function foo(param) {
//     let b = a;
//     let c = MYFANCEYSTUFF;
    
//     func(param);
// }

// class Foo {
//     public blub() {
//         let fn = o => o.a;

//         let durr = function () { };

//         function blub() {
//             durr();
//         }

//         blub();
//     }
// }
import {Controller, Get, UrlParam, Query, isNumber} from 'giuseppe';
import {Types} from '../Types';
import {Elasticsearch, SortOrder} from '../utils/Elasticsearch';
import {ApiConfiguration} from '../utils/ApiConfiguration';
import {RouteLogger} from '../utils/RouteLogger';
import {Injector, propertyInject, propertyNamedInject} from '../IoC';
import {AggregationHash} from '../models/Aggregations';
import {QueryBuilder} from '../utils/QueryBuilder';
import {SearchResultFormatter, GetResultFormatter} from '../utils/ResultFormatter';
import {JobResult} from '../models/JobResult';

class JobValidator {
    @propertyInject(Types.configuration)
    private static config: ApiConfiguration;

    public static sortExists(sortField: string): boolean {
        return !!JobValidator.config.search.sort[sortField];
    }
}

@Controller('jobs', Injector.get<RouteLogger>(Types.routeLogger).logRequest)
export class JobController {
    @propertyInject(Types.elasticsearch)
    private elasticsearch: Elasticsearch;

    @propertyInject(Types.configuration)
    private config: ApiConfiguration;

    @propertyInject(Types.queryBuilder)
    private queryBuilder: QueryBuilder;

    @propertyNamedInject(Types.searchResultFormatter, 'jobFormatter')
    private searchResultFormatter: SearchResultFormatter<JobResult>;

    @propertyNamedInject(Types.getResultFormatter, 'jobFormatter')
    private getResultFormatter: GetResultFormatter<any>;

    @Get()
    public async list( @Query('search') search?: string,
        @Query('raw_query', { alias: ['q', 'raw'] }) rawQuery?: string,
        @Query('offset', { validator: isNumber({ min: 0 }) }) offset?: number,
        @Query('limit', { validator: isNumber({ min: 0 }) }) limit?: number,
        @Query('sort', { validator: JobValidator.sortExists }) sort: string = this.config.search.sort['score'],
        @Query('order') order?: SortOrder,
        @Query('aggregations', { alias: 'facets' }) aggregations?: AggregationHash,
        @Query('facet_size') facetSize?: number): Promise<JobResult> {

        let query = this.queryBuilder.searchQuery(search, rawQuery, limit, offset, sort, order, aggregations, facetSize);
        return this.elasticsearch.client.search(query).then(result => this.searchResultFormatter.format(query, result));
    }

    @Get(':id')
    public async get( @UrlParam('id') id: string): Promise<any> {
        let query = this.queryBuilder.getQuery(id);
        return this.elasticsearch.client.get(query).then(result => this.getResultFormatter.format(query, result));
    }
}