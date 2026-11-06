---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.19.6
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Instance Generation

Up to the {doc}`previous chapter <objective_and_constraints>`, we have learned how to formulate mathematical models.
In this chapter, we explain the workflow of compiling a model into an OMMX instance and solving it via an OMMX Adapter.

:::{figure} ../images/model-and-instance-illustrated.svg
:alt: Providing instance data to a symbolic model produces solver input data (an instance)
:name: modeling-workflow
:width: 75%

Workflow up to creating instance data
:::

{numref}`Fig.%s <modeling-workflow>` reprints the workflow from model to instance.
Following this, we explain how to prepare instance data and then compile it.

Below, we use the following knapsack problem with synergy bonuses as an example.

```{code-cell} ipython3
import jijmodeling as jm


@jm.Problem.define("Knapsack with Synergy", sense=jm.ProblemSense.MAXIMIZE)
def problem(problem: jm.DecoratedProblem):
    N = problem.Natural()
    W = problem.Float(description="Weight limit of the problem")
    v = problem.Float(shape=(N,), description="Values of the items")
    w = problem.Float(shape=(N,), description="Weights of the items")
    s = problem.PartialDict(
        dtype=float, dict_keys=(N, N), description="Synergy bonus between items"
    )
    x = problem.BinaryVar(shape=(N,), description="Item selection variables")

    problem += jm.sum(v[i] * x[i] for i in N)
    problem += jm.sum(s[i, j] * x[i] * x[j] for i, j in s.keys())

    problem += problem.Constraint("weight", jm.sum(w[i] * x[i] for i in N) <= W)


problem
```

## Preparing instance data

You need to prepare data corresponding to each placeholder and category label.
Currently, the data specifications are as follows:

| Placeholder type | Corresponding Python data type |
| ---------------- | ------------------------------ |
| Single placeholder | A Python number or tuple matching the placeholder's value type |
| Placeholder array | A Python (nested) list or [`NumPy array`](xref:numpy#numpy.ndarray) matching the value type |
| Placeholder dictionary | A Python [`dictionary`](xref:python#dict) matching the value type |
| Category label | A Python list of unique numbers or strings |

You also need to satisfy constraints on array shapes and the totality of dictionaries.
At the moment, note that dictionary data cannot be provided as arrays.

Prepare instance data as a Python dictionary that maps each variable name to its data.
Let's create instance data for `problem`.

```{code-cell} ipython3
import random
import numpy as np

random.seed(42)
N_data = 10
W_data = random.randint(10, 75)
v_data = [random.uniform(1, 20) for _ in range(N_data)]
w_data = np.array(
    [random.uniform(1, 15) for _ in range(N_data)]
)  # NumPy arrays are also allowed
s_data = {(1, 2): 5.0, (1, 4): 3.0, (2, 9): 5.0, (3, 5): 10}

instance_data = {"N": N_data, "W": W_data, "v": v_data, "w": w_data, "s": s_data}
```

:::{admonition} Random instance data generation
:class: tip

You can use the [`Problem.generate_random_dataset`](xref:api_reference#jijmodeling.Problem.generate_random_dataset) and
[`Problem.generate_random_instance`](xref:api_reference#jijmodeling.Problem.generate_random_instance) methods to generate random instance data.
For more details, please refer to the API documentation and upcoming advanced topic tutorials.
:::

+++

## Compiling to an instance

Once the model and instance data are prepared, you can compile them into an OMMX instance.
The simplest way is to use the [`Problem.eval()`](xref:api_reference#jijmodeling.Problem.eval) method:

```{code-cell} ipython3
instance1 = problem.eval(instance_data)
instance1.constraints_df
```

```{code-cell} ipython3
instance1.decision_variables_df
```

```{code-cell} ipython3
instance1.objective
```

This actually calls [`Compiler.from_problem()`](xref:api_reference#jijmodeling.Compiler.from_problem) and
[`Compiler.eval_problem()`](xref:api_reference#jijmodeling.Compiler.eval_problem) internally, and is equivalent to:

```{code-cell} ipython3
compiler = jm.Compiler.from_problem(problem, instance_data)
instance2 = compiler.eval_problem(problem)

assert instance1.objective.almost_equal(instance2.objective)
assert len(instance1.constraints) == 1
assert len(instance2.constraints) == 1
assert instance2.constraints[0].equality == instance1.constraints[0].equality
assert instance2.constraints[0].function == instance1.constraints[0].function
```

:::{admonition} Why do we pass the problem twice?
:class: note

In the example above, we pass the `problem` problem to both
[`from_problem`](xref:api_reference#jijmodeling.Compiler.from_problem) and [`eval_problem`](xref:api_reference#jijmodeling.Compiler.eval_problem).
This may look redundant, but they serve different purposes:

The [`Problem`](xref:api_reference#jijmodeling.Problem) argument to [`from_problem`](xref:api_reference#jijmodeling.Compiler.from_problem)
:    Used to extract information such as decision variable types that the [`Compiler`](xref:api_reference#jijmodeling.Compiler)
     needs at evaluation time. In JijModeling, this bundle of information is called a
     [`Namespace`](xref:api_reference#jijmodeling.Namespace). Internally, this is obtained via the
     [`namespace`](xref:api_reference#jijmodeling.Problem.namespace) property and passed to the
     [`Compiler constructor`](xref:api_reference#jijmodeling.Compiler.__new__).

The [`Problem`](xref:api_reference#jijmodeling.Problem) argument to [`eval_problem`](xref:api_reference#jijmodeling.Compiler.eval_problem)
:    Specifies the [`Problem`](xref:api_reference#jijmodeling.Problem) you want to compile into an instance.
     A [`Compiler`](xref:api_reference#jijmodeling.Compiler) is not tied to a single problem, and can be reused for
     multiple [`Problem`](xref:api_reference#jijmodeling.Problem) objects that share placeholders and decision variables.
:::

If you only need to compile a [`Problem`](xref:api_reference#jijmodeling.Problem) into an instance,
[`Problem.eval()`](xref:api_reference#jijmodeling.Problem.eval) is convenient. On the other hand, a
[`Compiler`](xref:api_reference#jijmodeling.Compiler) object can also provide OMMX-side IDs of constraints and decision
variables via [`get_constraint_id_by_name`](xref:api_reference#jijmodeling.Compiler.get_constraint_id_by_name) and
[`get_decision_variable_by_name`](xref:api_reference#jijmodeling.Compiler.get_decision_variable_by_name).

In addition to compiling instances, [`Compiler`](xref:api_reference#jijmodeling.Compiler) can evaluate individual scalar
functions into OMMX [`Function`](xref:ommx_api#ommx.v1.Function) objects via
[`eval_function`](xref:api_reference#jijmodeling.Compiler.eval_function), or compile individual constraints (without registering
them on a Problem) into OMMX [`Constraint`](xref:ommx_api#ommx.v1.Constraint) objects via
[`eval_constraints`](xref:api_reference#jijmodeling.Compiler.eval_constraints).
Below is an example that evaluates a function expression using decision variables from `problem`:

```{code-cell} ipython3
x_ = problem.decision_vars["x"]
compiler.eval_function(jm.sum(x_.roll(1) * x_) - 1)
```

These `eval_function` and `eval_constraint` methods are useful for debugging, and can also be used to
transform a compiled [`ommx.v1.Instance`](xref:ommx_api#ommx.v1.Instance).

Once created, a Compiler can be reused across multiple models that share placeholders and decision
variables, and the **ID mappings for decision variables and constraints are preserved**. This is useful for
cases like compiling multiple models with the same parameters but different objectives or constraints
and comparing their results.
On the other hand, since each call to [`jijmodeling.Problem.eval`](xref:api_reference#jijmodeling.Problem.eval) creates a new Compiler, IDs for the same decision variables and constraints may differ between generated instances.
When IDs must remain consistent, create one [`Compiler`](xref:api_reference#jijmodeling.Compiler) explicitly and reuse [`jijmodeling.Compiler.eval_problem`](xref:api_reference#jijmodeling.Compiler.eval_problem).

:::{admonition} Transforming problems with the OMMX SDK
:class: tip

The  OMMX SDK provides various features for transforming a compiled
[`Instance`](xref:ommx_api#ommx.v1.Instance) object. For example, you can fix decision variable values or use
[`ommx.v1.Instance.to_qubo`](xref:ommx_api#ommx.v1.Instance.to_qubo) to convert a constrained problem into an unconstrained QUBO
via a penalty method. For details, see the official [OMMX documentation](https://jij-inc.github.io/ommx/en/).
:::

### Options for [`eval`](xref:api_reference#jijmodeling.Problem.eval) and [`eval_problem`](xref:api_reference#jijmodeling.Compiler.eval_problem)

Both [`Problem.eval()`](xref:api_reference#jijmodeling.Problem.eval) and
[`Compiler.eval_problem()`](xref:api_reference#jijmodeling.Compiler.eval_problem) accept the same keyword-only
arguments to control behavior:

`prune_unused_vars: bool`
:    When set to `True`, only decision variables that appear in the objective or constraints are registered in
     the [`Instance`](xref:ommx_api#ommx.v1.Instance). The default is `False`, and decision variables that do not appear in the
     model are still registered.

`constraint_detection: Optional[ConstraintDetectionConfig | bool] = None`
:    JijModeling detects the structure of constraints and reflects it in the OMMX instance so that
     OMMX Adapters can call solvers more efficiently. This detection is enabled by default, but it currently
     incurs a compilation overhead of up to a few seconds.
     Passing a [`ConstraintDetectionConfig`](xref:api_reference#jijmodeling.ConstraintDetectionConfig) object allows you to specify which constraint
     types to detect and to adjust behavior parameters. You can also pass `False` to disable detection entirely.

## Solving an instance

Once you have an OMMX instance, you can solve it using an OMMX Adapter.
Below is an example using the SCIP adapter:

```{code-cell} ipython3
from ommx_pyscipopt_adapter import OMMXPySCIPOptAdapter

# Solve the problem via SCIP and get a solution as ommx.v1.Solution
solution = OMMXPySCIPOptAdapter.solve(instance1)

print(f"Optimal objective value: {solution.objective}")

solution.decision_variables_df[["name", "subscripts", "value"]]
```

For details on how to use OMMX Adapters, see the
[OMMX User Guide](xref:ommx_doc#introduction).
In addition to SCIP, [OMMX Adapters for various solvers](xref:ommx_doc#user_guide/supported_ommx_adapters)
are available and can be used in the same manner.

:::{admonition} OMMX SDK name-based extraction does not support dict-based variables or constraints
:class: important

The [`Solution`](xref:ommx_api#ommx.v1.Solution) object provides name-based extraction methods such as
[`extract_decision_variables`](xref:ommx_api#ommx.v1.Solution.extract_decision_variables) and
[`extract_constraints`](xref:ommx_api#ommx.v1.Solution.extract_constraints).
At the moment, these do not support decision variables or constraints with string subscripts, so calling
them on a `Solution` for models that use dictionaries or category labels will raise an error.
In such cases, use [`Compiler.get_constraint_id_by_name()`](xref:api_reference#jijmodeling.Compiler.get_constraint_id_by_name)
or [`Compiler.get_decision_variable_by_name()`](xref:api_reference#jijmodeling.Compiler.get_decision_variable_by_name) to
retrieve IDs from the compiler, and pass those IDs to
[`ommx.v1.Solution.get_constraint_value`](xref:ommx_api#ommx.v1.Solution.get_constraint_value) or
[`ommx.v1.Solution.get_decision_variable_by_id`](xref:ommx_api#ommx.v1.Solution.get_decision_variable_by_id) to retrieve values.
:::
