---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.1
kernelspec:
  display_name: venv
  language: python
  name: venv
---

# Using random instance generation

{py:class}`~jijmodeling.Problem` provides methods to generate randomized sets of instance data, based on the problem's schema (its placeholders). This tutorial will go over all the different instance generation options.

There are two methods: 
- {py:meth}`Problem.generate_random_dataset` returns the data as a dictionary, like one you'd pass to {py:meth}`Problem.eval` as the instance data.
- {py:meth}`Problem.generate_random_instance` generates data in the same way, but returns the compiled problem as an OMMX instance. It's the same as using `generate_random_dataset` and then passing the returned dictionary to {py:meth}`Problem.eval`.

Both of these methods accept the same generation parameters: `default`, `options`, and `seed`. Meanwhile, `generate_random_instance` accepts additional options that are passed along to `Problem.eval`: `prune_unused_dec_vars` and `constraint_detection`, etc.

`seed` is simply the seed value used to initialize the random number generator. Use it when you want the generated instance to be reproducible.

`default` and `options` specify how values should be generated for your random instance. `options` accepts a dictionary that allows you to specify value ranges for each {py:class}`~jijmodeing.Placeholder` in your problem, while `default` is the fallback parameter. Anything that is not present in `options` will refer to `default` to determine how its values should be generated. 

Neither of these is _required_. You don't need to set `default` if specifying `options` for every placeholder, and just setting `default` can be enough to generate a basic instance. However, note that generated instances are not guaranteed to be feasible, that depends entirely on the problem and parameters set.

Let's go over how to specify these parameters for different kinds of problems. 

## The basics: Scalars

Our generation parameters `default` and `options` can be specified in several different  ways, namely:

- A fixed value (just a number).
- A Python `range`.
- The object returned by one the many functions in the {py:mod}`jijmodeling.generation` submodule.
- Ranges defined with tuples and dictionaries. Refer to the API docs for more details on how to use these.

When using a fixed value, the placeholder will be set to that number. When using ranges (be they built-in python ranges, the ones from {py:mod}`jijmodeling.generation`, or defined by tuples/dictionaries), those will serve the boundary for generating random values.

Let's look at a very simple problem to see how these are used.

```{code-cell} ipython3
import jijmodeling as jm

problem = jm.Problem("my problem")
x = problem.BinaryVar("x")
A = problem.Natural("A")
B = problem.Natural("B")
problem += A * x + B

problem.generate_random_dataset(default={"value": range(1, 10)})
```

In the above example, we don't use `options`, so we look to `default` when generating values for `A` and `B`. Both then get their own random value from within the default range.

In this case we used a regular Python range, which are naturally `[closed, open)`, meaning the lower boundary is included, but the higher is excluded. (eg. `range(1,4)` is 1, 2 or 3, but not 4) The ranges provided in {py:mod}`jijmodeling.generation` provide additional options for defining ranges, like {py:func}`jijmodeling.generation.open` (neither of the bounds is included) or {py:func}`jijmodeling.generation.at_least` (include lower bound, infinty as upper bound). Python ranges are equivalent to {py:func}`jijmodeling.generation.closed_open`.

`generation` has itself a couple of submodules: {py:mod}`jijmodeling.generation.size` and {py:mod}`jijmodeling.generation.value`. The functions provided by `generation` are dynamic, but the ones in the submodules are more explicit about types -- `size` being for natural numbers and `value` for floating point numbers. These are intended to be used respectively with the `size` and `value` options we'll discuss later. Otherwise, the same range functions are provided.

Generated values will conform to types. That is, if you have a Natural Placeholder, only natural numbers will be generated for it, even if you use a range parameter including a negative number like `(-10, 10)`.

Now, if we want to specify different ranges for `A` and `B`, we must pass a dictionary to `options`. Keys must match a placeholder's name, and values must be dictionaries specifying the options for that specific placeholder. In this scalar case, the only relevant option is `value`. We'll discuss other options that may go in the dictionary in future sections.

```{code-cell} ipython3
problem.generate_random_dataset(default={"value": range(1, 10)}, options={"A": {"value": range(50, 100)}})
```

In the above example, we give `A` its own value range through `options`. Since we didn't specify `B`, `default` is still used for its values. We can also set both in `options`:

```{code-cell} ipython3
problem.generate_random_dataset(options = {"A": {"value": range(50, 100)}, "B": {"value": range(1, 10)}})
```

## Array placeholders

With array placeholders, values can be specified in much the same way as scalars. If the placeholder's `shape` is well defined, an array (potentially multi-dimensional) of values will be generated matching the shape, all within the `value` range (or `default`, if `value` isn't specified for this placeholder).

```{code-cell} ipython3
problem = jm.Problem("my problem")
# here we use a literal value for simplicity, but `shape` itself could be defined with a placeholder.
x = problem.BinaryVar("x", shape=10)
A = problem.Natural("A", shape=10)
problem += jm.sum(10, lambda i: A[i] * x[i])

problem.generate_random_dataset(options={"A": {"value": range(1,10)}})
```

If the placeholder's `shape` isn't fully defined, we should specify how many elements the array should have to be able to generate the instance data. To do that, we add a `size` parameter to the options dictionary. As `size` defines the length of the array, it must be a natural numbers, but like `value`, we still accept ranges -- meaning a random number of elements can be generated.

```{code-cell} ipython3
problem = jm.Problem("my problem")
A = problem.Float("A", ndim=1)
N = A.len_at(0)
x = problem.BinaryVar("x", shape=(N,))

problem += jm.sum(N, lambda i: A[i] * x[i])

problem.generate_random_dataset(
    options={
        "A": {"value": range(-10, 10), "size": range(1,10),}
    },
)
```

When a placeholder has a partially defined `shape` (such as `(None, 10)`, etc.), `size` will be referenced to generate the number of elements for each dimension without a predefined value. Specifying `size` for an array placeholder with a well-defined shape has no effect; the `shape` information takes priority.

+++

## Dictionary placeholders

For dictionary-like Placeholders keyed by `CategoryLabel`s, you _must_ define the keys that go in those category labels through `options`. The most explicit way of doing so, is by using a `keys` parameter. For example, if your problem has a category label `C`, this will define "X", "Y", and "Z" as the three valid keys:

```python
{ "C": {"keys": ["X", "Y", "Z"]} }
```

So each dictionary placeholder keyed by `C` will generate a value for each of the "X", "Y" and "Z" keys. Value ranges work the same way as array and scalar placeholders: they can be passed through `options`for each placeholder separately, or you can use `default`.

However, if the actual strings don't matter for the instance you're generating, you can also use `size` (with either a fixed value or a range). In that case, we will generate a number arbitrary strings fitting that parameter. 

```python
{ "C": {"size": 5 } }
{ "C": {"size": range(3, 10)}}
```

As said above, values will be generated for each key in each dictionary-like placeholder. This is still true for _partial_ dictionaries: by default, all keys are used. To limit the amount of keys used in a partial placeholder, we additionally pass either `keys` or `size` as part of that placeholder's entry in `options` to define a subset.

For example, let's assume we have a partial dictionary placeholder `D`, keyed by the category label `C`:

```python
{ "C": {"keys": ["X", "Y", "Z"]}, "D": {"keys": ["X", "Y"], "value": range(10, 100)} } }
```

The above only works when you've defined the category label values using `keys`, and you must guarantee that it's a valid subset.

On the other hand, using `size` in the partial dictionary's options, we can specify that a random selection must be made from the valid keys (no matter how they were specified):
```python
# either 1 or 2 keys will be picked at random:
{ "C": {"keys": ["X", "Y", "Z"]}, "D": {"size": range(1, 3), "value": range(10, 100)} } } 
# 1, 2, 3, or 4 keys will be picked at random:
{ "C": {"size": range(3, 10)}, "D": {"size": range(1, 5), "value": range(10, 100)} } } 
```
