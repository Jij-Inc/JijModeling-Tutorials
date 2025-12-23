---
jupytext:
  text_representation:
    extension: .md
    format_name: myst
    format_version: 0.13
    jupytext_version: 1.18.1
kernelspec:
  display_name: .venv
  language: python
  name: python3
---

# Solving Optimization Problems with OpenJij

To understand how to use `jijmodeling`, let's solve the knapsack problem on this page. However, since `jijmodeling` is a tool for describing mathematical models, it cannot solve optimization problems on its own. Therefore, we will solve it in combination with the mathematical optimization sampler [OpenJij](https://tutorial.openjij.org/en/intro.html).

To use `jijmodeling` with OpenJij, you need to install a Python package called `ommx-openjij-adapter` ([GitHub](https://github.com/Jij-Inc/ommx/tree/main/python/ommx-openjij-adapter), [PyPI](https://pypi.org/project/ommx-openjij-adapter/)). Please install it with the following command:

```bash
pip install ommx-openjij-adapter
```

+++

## Problem Setting

The knapsack problem can be formulated as a mathematical model as follows:

$$
\begin{align*}
\mathrm{maximize} \quad & \sum_{i=0}^{N-1} v_i x_i \\
\mathrm{s.t.} \quad & \sum_{i=0}^{N-1} w_i x_i \leq W, \\
& x_{i} \in \{ 0, 1\} 
\end{align*}
$$

:::{hint}
For more details on the formulation of the knapsack problem, please refer to [here](https://jij-inc.github.io/JijZept-Tutorials/en/src/02_knapsack.html).
:::

The meaning of each parameter in this mathematical model is as follows:

| Parameter | Description |
| --- | --- |
| $N$ |	Total number of items |
| $v_{i}$ | Value of item $i$ |
| $w_{i}$ | Weight of item $i$ |
| $W$ | Weight capacity of the knapsack |

In this explanation, we will solve an [instance](what_is_instance) obtained by inputting the following values into the parameters $v_{i}, w_{i}, W$ of the above mathematical model:

| Parameter | Value |
| --- | --- |
| $v_{i}$ | `[10, 13, 18, 31, 7, 15]` |
| $w_{i}$ | `[11, 15, 20, 35, 10, 33]` |
| $W$ | `47` |

(what_is_instance)=
:::{admonition} What is an instance?
In `jijmodeling`, a dictionary that stores specific values for the parameters of a mathematical model is called "instance data", and a mathematical model with specific values assigned to its parameters is called an "instance".
:::

+++

## Procedure for Generating an Instance

Using `jijmodeling`, you can generate an instance to input into the solver in the following 3 steps:

1. Formulate the knapsack problem
2. Prepare instance data
3. Generate an instance

![Diagram of the process to generate an instance from a mathematical model](./assets/scip_01.png)

+++

## Step1. Formulate the Knapsack Problem

Formulating the knapsack problem using `jijmodeling` results in the following Python code:

```{code-cell} ipython3
import jijmodeling as jm

@jm.Problem.define("Knapsack", sense=jm.ProblemSense.MAXIMIZE)
def knapsack_problem(problem: jm.DecoratedProblem):
    # Value of items
    v = problem.Natural("v", ndim=1)
    # Weight of items
    w = problem.Natural("w", ndim=1)
    # Weight capacity of the knapsack
    W = problem.Natural("W")
    # Total number of items
    N = v.len_at(0, latex="N")
    # Decision variable: 1 if item i is in the knapsack, 0 otherwise
    x = problem.BinaryVar("x", shape=(N,)) 

    # Objective function
    problem += jm.sum(v[i] * x[i] for i in N)
    # Constraint: Do not exceed the weight capacity of the knapsack
    problem += problem.Constraint("Weight Constraint", jm.sum(w[i] * x[i] for i in N) <= W)

knapsack_problem
```

:::{hint}
For more details on how to formulate with `jijmodeling`, please refer to [here](../references/migration_guide_to_jijmodeling2.ipynb).
:::

+++

## Step2. Prepare Instance Data

Next, prepare the instance data for the parameters $v_i, w_i, W$ of the mathematical model formulated in Step1.

```{code-cell} ipython3
instance_data = {
    "v": [10, 13, 18, 31, 7, 15],  # Data of item values
    "w": [11, 15, 20, 35, 10, 33], # Data of item weights
    "W": 47,                       # Data of the knapsack's weight capacity
}
```

## Step3. Convert to an Instance

Finally, let's generate an instance using the formulated mathematical model and the prepared instance data.

```{code-cell} ipython3
instance = knapsack_problem.eval(instance_data)
```

:::{hint}
The return value of `Problem.eval` is an `ommx.v1.Instance` object. For more details about it, please refer to [here](https://jij-inc.github.io/ommx/en/user_guide/instance.html).
:::

+++

## Solving the Optimization Problem

Now, let's solve the instance obtained in Step3 with the optimization sampler OpenJij. The following Python code can be used to obtain multiple solutions (the sample set) for the objective function:

```{code-cell} ipython3
from ommx_openjij_adapter import OMMXOpenJijSAAdapter

# Solve with OpenJij and retrieve the sample set as an ommx.v1.SampleSet
sample_set = OMMXOpenJijSAAdapter.sample(instance, num_reads=10, uniform_penalty_weight=5)

sample_set.summary
```

The above code uses simulated annealing in `openjij`, and `num_reads=5` indicates that it samples only five times. You can sample multiple times by increasing the value of `num_reads`.

+++

:::{hint}
The return value of `OMMXOpenJijSAAdapter.sample` is an `ommx.v1.SampleSet`. For more information, see [here](https://jij-inc.github.io/ommx/python/ommx/autoapi/ommx/v1/index.html#ommx.v1.SampleSet).
:::

+++

Using `ommx.v1.SampleSet.best_feasible`, we select, for a maximization problem like this one, the feasible solution with the largest objective value (and for a minimization problem, the feasible solution with the smallest objective value) among the solutions that satisfy the constraints in the instance.

You can obtain the optimal value of the objective function with the following Python code:

```{code-cell} ipython3
# Retrieve the best feasible solution from the sample set
solution = sample_set.best_feasible_unrelaxed

print(f"Optimal objective value: {solution.objective}")
```

In addition, you can use the `decision_variables_df` property of `solution` to display the state of decision variables as a `pandas.DataFrame` object:

```{code-cell} ipython3
df = solution.decision_variables_df
df[df["name"] == "x"][["name", "subscripts", "value"]]
```

:::{hint}
The return value of `ommx.v1.SampleSet.best_feasible` is an `ommx.v1.Solution` object. For more information, see [here](https://jij-inc.github.io/ommx/en/user_guide/solution.html).
:::
