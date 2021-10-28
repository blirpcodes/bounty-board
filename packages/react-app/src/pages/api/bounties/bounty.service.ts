import Bounty from '../../../models/Bounty';
import { Query } from 'mongoose';
import { AcceptedSortOuputs, FilterParams, SortParams } from '../../../types/Filter';
import { FilterQuery } from '../../../types/Queries';

export const getFilters = (query: any): FilterParams => {
	/**
	 * Retrieve implemented filters from the query string params
	 */
	const filters = {} as FilterParams;
	
	filters.status = query.status as string;
	filters.search = query.search as string;
	
	query.lte ? filters.$lte = Number(query.lte) : null;
	query.gte ? filters.$gte = Number(query.gte) : null;

	return filters;
};

export const getSort = (query: any): SortParams => {
	/**
	 * Retrieve implemented sort filters from query string params
	 * Sort defaults to ascending order
	 */
	const sort = {} as SortParams;
	const FALSY_STRINGS = ['false', '0', 'desc', 'no'];
	
	const isDescending = FALSY_STRINGS.includes(query.asc);

	isDescending ? sort.order = 'desc' : sort.order = 'asc';
	
	sort.sortBy = getSortByValue(query.sortBy);
	
	return sort;
};

export const getSortByValue = (originalInput: string): AcceptedSortOuputs => {
	/**
	 * Allows passing of various values as sort params. These need to coalesce
	 * to a mongoDB schema item, so I've put in a Type for accepted sort outputs
	 * to indicate the required @return value.
	 */
	let output: AcceptedSortOuputs;
	switch (originalInput) {
	// redundant switch written for later extensibility
	case 'reward':
		output = 'reward.amount';
		break;
	default:
		output = 'reward.amount';
	}
	return output;
};

export const filterStatus = (query: FilterQuery, status: string): FilterQuery => {
	/**
	 * Pass status and append the corresponding status query to the query object
	 */
	if (status == null || status == '' || status == 'All') {
		query.status = ['Open', 'In-Progress', 'In-Review', 'Completed'];
	} else {
		query.status = status;
	}
	return query;
};

export const filterSearch = (query: FilterQuery, search: string): FilterQuery => {
	/**
	 * Pass any text search terms to the query object
	 */
	if (!(search == null || search == '')) {
		query['$text'] = { $search: search };
	}
	return query;
};

export const filterLessGreater = ({ by, query, $lte, $gte }: {
	by: AcceptedSortOuputs;
	query: FilterQuery;
	$lte?: number;
	$gte?: number;
}): FilterQuery => {
	/**
	 * Filters the passed @param by according to a standardised filter query:
	 * Filters are in terms of `by` <= @param $lte 
	 * and/or 
	 * `by` >= @param $gte
	 * Base case is to always filter for (`$gte` >= 0)
	 * @returns a mongoose formatted query
	 */
	if ($gte) {
		query[by] = { $gte };
	} else {
		query[by] = { $gte: 0 };
	}
	if ($lte) {
		query[by]!.$lte = $lte;
	}
	return query;
};

export const handleEmpty = (query: FilterQuery): FilterQuery | Record<string, unknown> => {
	const isEmpty: boolean = Object.values(query).every(x => x === null || x === '');
	return query === isEmpty ? {} : query;
};

export const handleFilters = (filters: FilterParams): any => {
	/**
	 * Construct the filter query and return query object from mongoose
	 */
	let filterQuery = {} as FilterQuery;
	
	const { status, search, $lte, $gte } = filters;
	
	filterQuery = filterStatus(filterQuery, status);
	filterQuery = filterSearch(filterQuery, search);
	filterQuery = filterLessGreater({ query: filterQuery, by: 'reward.amount', $lte, $gte });
	filterQuery = handleEmpty(filterQuery);

	return Bounty.find(filterQuery);
};

export const handleSort = (query: Query<any, any>, sort: SortParams): Query<any, any> => {
	/**
	 * Take the existing query object and add any sorting information before returning
	 */
	const sortStatement = { [sort.sortBy as string]: sort.order };
	return query.sort(sortStatement);
};

export const handleFiltersAndSorts = async (filters: FilterParams, sort: SortParams): Promise<Query<any, any>> => {
	/**
	 * Construct the query object (awaiting execution) from filters and sorts
	 */
	let query: Query<any, any>;
	query = handleFilters(filters);
	query = handleSort(query, sort);
	return query;
};