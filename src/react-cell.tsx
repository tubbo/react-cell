import React, { useMemo } from 'react'
import { DocumentNode } from 'graphql'
import { useQuery, ApolloError, QueryResult, QueryHookOptions } from '@apollo/client'

/**
 * Props for cell components.
 */
export type CellProps<T, P> = P & QueryRest<T>

/**
 * Component that makes up a piece of a Cell.
 */
export type CellComponent<T, P> = (props: CellProps<T, P>) => JSX.Element

/**
 * Props passed to the failure component when an error occurs.
 */
export interface FailureProps {
  error: ApolloError
}

export interface CellDefinition<T = any, P = any> {
  /**
   * Rendered when there is no data in the result, or if the cell's
   * custom `isEmpty()` hook returns false.
   */
  Empty?: CellComponent<T, P>

  /**
   * Rendered when the query is loading data.
   */
  Loading?: CellComponent<T, P>

  /**
   * Rendered when an error occurs fetching data.
   */
  Failure?: CellComponent<T, P & FailureProps>

  /**
   * Rendered when the component has data to show.
   */
  Success: CellComponent<T, P>

  /**
   * Optional hook for determining whether the query result is empty.
   */
  isEmpty?: (data?: any) => boolean

  /**
   * Optional hook for configuring the Apollo client.
   */
  configure?: (options: QueryHookOptions<T>) => QueryHookOptions<T>

  /**
   * Optional hook for decorating data before it is rendered.
   */
  decorate?: (data?: T) => T | null | undefined
}

/**
 * Other metadata and functionality in the query, such as fetch policy configuration
 * and `refetch()` capabilities.
 */
export type QueryRest<T> = Omit<QueryResult<T>, 'error' | 'loading' | 'data'>

/**
 * Higher-order component for creating new cells.
 */
export default function createCell<T, P = {}>(
  query: DocumentNode,
  {
    Success,
    Empty = () => <></>,
    Loading = () => <></>,
    Failure = ({ error }: FailureProps) => {
      console.error(error)

      return <></>
    },
    isEmpty = (data?: any) => {
      if (!data) return false

      const field = data[Object.keys(data)[0]]

      return field == null || (Array.isArray(field) && field.length === 0)
    },
    configure = options => options,
    decorate = data => data
  }: CellDefinition<T, P>
) {
  return (variables: P) => {
    const options = useMemo<QueryHookOptions<T>>(() => configure({ variables }), [])
    const { error, loading, data: raw, ...rest } = useQuery<T>(query, options)
    const data = useMemo(() => decorate(raw), [raw])

    if (error) {
      return <Failure error={error} {...variables} {...rest} />
    }

    if (loading) {
      return <Loading {...variables} {...rest} />
    }

    if (isEmpty(data)) {
      return <Empty {...variables} {...rest} />
    }

    return <Success {...data} {...variables} {...rest} />
  }
}
