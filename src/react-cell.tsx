import React from 'react'
import { DocumentNode } from 'graphql'
import { useQuery, ApolloError, QueryResult } from '@apollo/client'

type CellComponent<T, P> = (props: P & QueryRest<T>) => JSX.Element

export interface FailureProps {
  error: ApolloError
}

export interface CellDefinition<T, P> {
  Empty?: CellComponent<T, P>
  Loading?: CellComponent<T, P>
  Failure?: CellComponent<T, P & FailureProps>
  Success: CellComponent<T, P>
  isEmpty?: (data?: any) => boolean
}

type QueryRest<T> = Omit<QueryResult<T>, 'error' | 'loading' | 'data'>

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
    }
  }: CellDefinition<T, P>
) {
  return (props: P) => {
    const { error, loading, data, ...rest } = useQuery<T>(query, {
      variables: props
    })

    if (error) {
      return <Failure error={error} {...props} {...rest} />
    }

    if (loading) {
      return <Loading {...props} {...rest} />
    }

    if (isEmpty(data)) {
      return <Empty {...props} {...rest} />
    }

    return <Success {...data} {...props} {...rest} />
  }
}
