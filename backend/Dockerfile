# create Dockerfile that uses uv.lock to install dependencies to the system python install and then runs the app

FROM python:3.14

# install uv
RUN pip install uv

# Set the working directory
WORKDIR /app

# Copy the uv.lock file to the container
COPY pyproject.toml /app/pyproject.toml
COPY uv.lock /app/uv.lock

ENV UV_LINK_MODE=copy
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# copy in the code
COPY ./icc_eval_core_api/ /app/icc_eval_core_api/

# Expose the port the app runs on
EXPOSE 8000

# copy in the run command
COPY ./launch_api.sh /opt/launch_api.sh

# Run the app
CMD ["/opt/launch_api.sh"]
