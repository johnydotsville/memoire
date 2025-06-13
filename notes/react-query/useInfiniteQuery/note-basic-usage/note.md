# Простая выборка данных

```javascript
export function useTasksInfinite() {
  const { 
    data,
    isFetching,
    error,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasksInfinite,
    initialPageParam: { 
      limit: 2
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.meta.hasMore ? {
        cid: lastPage.data[lastPage.data.length-1].id,
        limit: 2
      } : undefined
    }
  })

  return {
    data,
    isFetching,
    error,
    fetchNextPage,
  }
}
```

```javascript
// Либа дает нам контекст, внутри него есть поле pageParam.
export async function fetchTasksInfinite({ pageParam }) {
  const url = urlBuilder.tasksInfiniteUrlBuilder(pageParam);
  const result = await fetchData(url);
  return result;
}
```

```react
export const TaskListInfinite = () => {
  const { 
    data,
    isFetching,
    error,
    fetchNextPage
  } = useTasksInfinite();

  if (isFetching) return <div>Бесконечный стук шагов...</div>;
  if (error) return <div>{ error.message }</div>

  return (
    <Stack>
      <TaskList tasks={data.pages.flatMap(x => x.data)} />
      <Button onClick={() => fetchNextPage()}>Go next</Button>
    </Stack>
  )
}
```

* Механика работы:
  * При первой загрузке вызывает queryFn и передает ей объект `initialPageParam`.
    * Он передается не как отдельный самостоятельный объект, а в поле pageParam объекта-контекста.
    * Так что если queryFn нужны несколько параметров, то надо оформлять их в виде единого объекта.
  * Загруженные данные попадают в кэш в виде двух массивов: pages и pageParams.
    * Так что `data` содержит эти два поля.
    * pages - массив "страниц".
      * Страница - это каждая пачка данных, полученная от queryFn. Один вызов queryFn - одна страница.
    * pageParams - массив параметров, благодаря которым соответствующая страница загрузилась.
      * В него попадает initialPageParam и результаты getNextPageParam.
  * Для загрузки следующей страницы есть функция `fetchNextPage`, параметров не требует.
    * Она сначала вызывает функцию `getNextPageParam` и полученный от нее объект передает в queryFn.
      * Если getNextPageParam возвращает undefined - это признак того, что данных больше нет, и тогда либа не вызывает queryFn.
      * Соответственно, на нас ложится реализация логики определения, есть еще данные или нет. Если данные есть, то мы должны из getNextPageParam вернуть объект с параметрами для queryFn.
      * Формат getNextPageParam такой `(lastPage, allPages) => obj | undefined`
        * Т.е. либа нам отдает последнюю загруженную страницу и массив всех страниц.
        * На основе этой инфы мы должны понять, есть еще данные или нет.
        * Конкретная реализация - на нас. Например, мы на сервере при выборе очередной пачки можем рассчитать, есть еще данные или нет, и с пачкой данных вернуть флаг вроде hasMore. В данном примере так и сделано.