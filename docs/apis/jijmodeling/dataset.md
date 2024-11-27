## <span class="class-func-prefix">class</span> <span class="class-func-name">Miplib</span>

Automatically load problems from the MIPLIB dataset.

Warning: the whole dataset is downloaded and cached in your filesystem when
first used. It is quite large (~300MB download, ~600MB extracted), so the
time it takes to download will likely be significant. We recommend first
trying to use this class in a REPL to assure the dataset has been cached.

The dataset is stored at `{data_dir}/jijmodeling/miplib`, where
`{data_dir}` depends on your operating system:

|Platform| {data_dir} location                    | Example/System Default                   |
|:-------|:---------------------------------------|:-----------------------------------------|
|Linux   |`$XDG_DATA_HOME` or `$HOME/.local/share`|`/home/alice/.local/share`                |
|macOS   |`$HOME/Library/Application Support`     |`/Users/Alice/Library/Application Support`|
|Windows |`%AppData%                              |`C:\Users\Alice\AppData\Roaming`          |


Examples
---------
```python
>>> import jijmodeling.dataset

Initialize the dataset. If not cached in your filesystem, this will take several minutes.
>>> miplib = jijmodeling.dataset.Miplib()

Show names of each available instance.
>>> miplib.available_names  # doctest: +ELLIPSIS
[...]

Get basic statistics of a specific instance.
>>> miplib.instance_statistics["unitcal_7"]
{'variable': 25755, 'constraint': 48939, 'binary': 2856, 'integer': 0, 'continuous': 22899, 'non_zero': 127595}

Load "revised-submissions/miplib2010_pg/instances/pg.mps.gz" in benchmark.zip
>>> problem, instance_data = miplib.load("pg")

```




---
## <span class="class-func-prefix">class</span> <span class="class-func-name">Qplib</span>

Automatically load problems from the MIPLIB dataset.

Warning: the whole dataset is downloaded and cached in your filesystem when
first used. It is quite large (~700MB download, ~1.5GB extracted), so the
time it takes to download will likely be significant. We recommend first
trying to use this class in a REPL to assure the dataset has been cached.

The dataset is stored at `{data_dir}/jijmodeling/qplib`, where
`{data_dir}` depends on your operating system:

|Platform| {data_dir} location                    | Example/System Default                   |
|:-------|:---------------------------------------|:-----------------------------------------|
|Linux   |`$XDG_DATA_HOME` or `$HOME/.local/share`|`/home/alice/.local/share`                |
|macOS   |`$HOME/Library/Application Support`     |`/Users/Alice/Library/Application Support`|
|Windows |`%AppData%                              |`C:\Users\Alice\AppData\Roaming`          |


Examples
---------
```python
>>> import jijmodeling.dataset

Initialize the dataset. If not cached in your filesystem, this will take several minutes.
>>> qplib = jijmodeling.dataset.Qplib()

Show the names of each available instance.
>>> qplib.available_names  # doctest: +ELLIPSIS
[...]

Get basic statistics of a specific instance.
>>> qplib.instance_statistics["QPLIB_2205"]
{'variables': 2884, 'constraints': 2874, 'binary': 958, 'integer': 0, 'continuous': 1926, 'non_zero': 13013}

Load a problem instance from QPLIB.
>>> problem, instance_data = qplib.load("QPLIB_1976")

```



